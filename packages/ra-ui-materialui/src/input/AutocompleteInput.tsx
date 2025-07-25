import * as React from 'react';
import {
    isValidElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import clsx from 'clsx';
import {
    Autocomplete,
    type AutocompleteChangeReason,
    type AutocompleteProps,
    Chip,
    TextField,
    type TextFieldProps,
    createFilterOptions,
    useForkRef,
} from '@mui/material';
import {
    type ComponentsOverrides,
    styled,
    useThemeProps,
} from '@mui/material/styles';
import {
    type ChoicesProps,
    FieldTitle,
    type RaRecord,
    useChoicesContext,
    useInput,
    useSuggestions,
    type UseSuggestionsOptions,
    useTimeout,
    useTranslate,
    warning,
    useGetRecordRepresentation,
    useEvent,
} from 'ra-core';
import {
    type SupportCreateSuggestionOptions,
    useSupportCreateSuggestion,
} from './useSupportCreateSuggestion';
import type { CommonInputProps } from './CommonInputProps';
import { InputHelperText } from './InputHelperText';
import { sanitizeInputRestProps } from './sanitizeInputRestProps';

const defaultFilterOptions = createFilterOptions();

/**
 * An Input component for an autocomplete field, using an array of objects for the options
 *
 * Pass possible options as an array of objects in the 'choices' attribute.
 *
 * By default, the options are built from:
 *  - the 'id' property as the option value,
 *  - the 'name' property as the option text
 * @example
 * const choices = [
 *    { id: 'M', name: 'Male' },
 *    { id: 'F', name: 'Female' },
 * ];
 * <AutocompleteInput source="gender" choices={choices} />
 *
 * You can also customize the properties to use for the option name and value,
 * thanks to the 'optionText' and 'optionValue' attributes.
 * @example
 * const choices = [
 *    { _id: 123, full_name: 'Leo Tolstoi', sex: 'M' },
 *    { _id: 456, full_name: 'Jane Austen', sex: 'F' },
 * ];
 * <AutocompleteInput source="author_id" choices={choices} optionText="full_name" optionValue="_id" />
 *
 * `optionText` also accepts a function, so you can shape the option text at will:
 * @example
 * const choices = [
 *    { id: 123, first_name: 'Leo', last_name: 'Tolstoi' },
 *    { id: 456, first_name: 'Jane', last_name: 'Austen' },
 * ];
 * const optionRenderer = choice => `${choice.first_name} ${choice.last_name}`;
 * <AutocompleteInput source="author_id" choices={choices} optionText={optionRenderer} />
 *
 * `optionText` also accepts a React Element, that can access
 * the related choice through the `useRecordContext` hook. You can use Field components there.
 * Note that you must also specify the `matchSuggestion` and `inputText` props
 * @example
 * const choices = [
 *    { id: 123, first_name: 'Leo', last_name: 'Tolstoi' },
 *    { id: 456, first_name: 'Jane', last_name: 'Austen' },
 * ];
 * const matchSuggestion = (filterValue, choice) => choice.first_name.match(filterValue) || choice.last_name.match(filterValue)
 * const inputText = (record) => `${record.fullName} (${record.language})`;
 *
 * const FullNameField = () => {
 *     const record = useRecordContext();
 *     return <span>{record.first_name} {record.last_name}</span>;
 * }
 * <AutocompleteInput source="author" choices={choices} optionText={<FullNameField />} matchSuggestion={matchSuggestion} inputText={inputText} />
 *
 * The choices are translated by default, so you can use translation identifiers as choices:
 * @example
 * const choices = [
 *    { id: 'M', name: 'myroot.gender.male' },
 *    { id: 'F', name: 'myroot.gender.female' },
 * ];
 *
 * However, in some cases (e.g. inside a `<ReferenceInput>`), you may not want
 * the choice to be translated. In that case, set the `translateChoice` prop to false.
 * @example
 * <AutocompleteInput source="gender" choices={choices} translateChoice={false}/>
 *
 * The object passed as `options` props is passed to the Material UI <TextField> component
 *
 * @example
 * <AutocompleteInput source="author_id" options={{ color: 'secondary', InputLabelProps: { shrink: true } }} />
 */
export const AutocompleteInput = <
    OptionType extends RaRecord = RaRecord,
    Multiple extends boolean | undefined = false,
    DisableClearable extends boolean | undefined = boolean | undefined,
    SupportCreate extends boolean | undefined = false,
>(
    inProps: AutocompleteInputProps<
        OptionType,
        Multiple,
        DisableClearable,
        SupportCreate
    >
) => {
    const props = useThemeProps({
        props: inProps,
        name: PREFIX,
    });
    const {
        choices: choicesProp,
        className,
        clearOnBlur = true,
        clearText = 'ra.action.clear_input_value',
        closeText = 'ra.action.close',
        create,
        createLabel,
        createItemLabel = 'ra.action.create_item',
        createValue,
        createHintValue,
        debounce: debounceDelay = 250,
        defaultValue,
        emptyText,
        emptyValue = '',
        field: fieldOverride,
        format,
        helperText,
        id: idOverride,
        inputText,
        isFetching: isFetchingProp,
        isLoading: isLoadingProp,
        isPending: isPendingProp,
        isRequired: isRequiredOverride,
        label,
        limitChoicesToValue,
        matchSuggestion,
        margin,
        fieldState: fieldStateOverride,
        filterToQuery: filterToQueryProp = DefaultFilterToQuery,
        formState: formStateOverride,
        multiple = false,
        noOptionsText,
        onBlur,
        onChange,
        onCreate,
        openText = 'ra.action.open',
        optionText,
        optionValue,
        parse,
        resource: resourceProp,
        shouldRenderSuggestions,
        setFilter,
        size,
        source: sourceProp,
        suggestionLimit = Infinity,
        TextFieldProps,
        translateChoice,
        validate,
        variant,
        onInputChange,
        disabled,
        readOnly,
        getOptionDisabled: getOptionDisabledProp,
        ...rest
    } = props;

    const filterToQuery = useEvent(filterToQueryProp);

    const {
        allChoices,
        isPending,
        error: fetchError,
        resource,
        source,
        setFilters,
        isFromReference,
    } = useChoicesContext({
        choices: choicesProp,
        isFetching: isFetchingProp,
        isLoading: isLoadingProp,
        isPending: isPendingProp,
        resource: resourceProp,
        source: sourceProp,
    });

    const translate = useTranslate();

    const {
        id,
        field,
        isRequired,
        fieldState: { error, invalid },
    } = useInput({
        defaultValue,
        id: idOverride,
        field: fieldOverride,
        fieldState: fieldStateOverride,
        formState: formStateOverride,
        isRequired: isRequiredOverride,
        onBlur,
        onChange,
        parse,
        format,
        resource,
        source,
        validate,
        disabled,
        readOnly,
        ...rest,
    });

    const finalChoices = useMemo(
        () =>
            // eslint-disable-next-line eqeqeq
            emptyText == undefined || isRequired || multiple
                ? allChoices
                : [
                      {
                          [optionValue || 'id']: emptyValue,
                          [typeof optionText === 'string'
                              ? optionText
                              : 'name']: translate(emptyText, {
                              _: emptyText,
                          }),
                      },
                  ].concat(allChoices || []),
        [
            allChoices,
            emptyValue,
            emptyText,
            isRequired,
            multiple,
            optionText,
            optionValue,
            translate,
        ]
    );

    const selectedChoice = useSelectedChoice<
        OptionType,
        Multiple,
        DisableClearable,
        SupportCreate
    >(field.value, {
        choices: finalChoices,
        // @ts-ignore
        multiple,
        optionValue,
    });

    useEffect(() => {
        if (emptyValue == null) {
            throw new Error(
                `emptyValue being set to null or undefined is not supported. Use parse to turn the empty string into null.`
            );
        }
    }, [emptyValue]);

    useEffect(() => {
        // eslint-disable-next-line eqeqeq
        if (isValidElement(optionText) && emptyText != undefined) {
            throw new Error(
                `optionText of type React element is not supported when setting emptyText`
            );
        }
        // eslint-disable-next-line eqeqeq
        if (isValidElement(optionText) && inputText == undefined) {
            throw new Error(`
If you provided a React element for the optionText prop, you must also provide the inputText prop (used for the text input)`);
        }
        if (
            isValidElement(optionText) &&
            !isFromReference &&
            // eslint-disable-next-line eqeqeq
            matchSuggestion == undefined
        ) {
            throw new Error(`
If you provided a React element for the optionText prop, you must also provide the matchSuggestion prop (used to match the user input with a choice)`);
        }
    }, [optionText, inputText, matchSuggestion, emptyText, isFromReference]);

    useEffect(() => {
        warning(
            /* eslint-disable eqeqeq */
            shouldRenderSuggestions != undefined && noOptionsText == undefined,
            `When providing a shouldRenderSuggestions function, we recommend you also provide the noOptionsText prop and set it to a text explaining users why no options are displayed. It supports translation keys.`
        );
        /* eslint-enable eqeqeq */
    }, [shouldRenderSuggestions, noOptionsText]);

    const getRecordRepresentation = useGetRecordRepresentation(resource);

    const { getChoiceText, getChoiceValue, getSuggestions } = useSuggestions({
        choices: finalChoices,
        limitChoicesToValue,
        matchSuggestion,
        optionText:
            optionText ??
            (isFromReference ? getRecordRepresentation : undefined),
        optionValue,
        createValue,
        createHintValue,
        selectedItem: selectedChoice,
        suggestionLimit,
        translateChoice: translateChoice ?? !isFromReference,
    });

    const [filterValue, setFilterValue] = useState('');

    const handleChange = useEvent((newValue: any) => {
        if (multiple) {
            if (Array.isArray(newValue)) {
                field.onChange(newValue.map(getChoiceValue), newValue);
            } else {
                field.onChange(
                    [...(field.value ?? []), getChoiceValue(newValue)],
                    newValue
                );
            }
        } else {
            field.onChange(getChoiceValue(newValue) ?? emptyValue, newValue);
        }
    });

    // eslint-disable-next-line
    const debouncedSetFilter = useCallback(
        debounce(filter => {
            if (setFilter) {
                return setFilter(filter);
            }

            if (choicesProp) {
                return;
            }

            setFilters(filterToQuery(filter));
        }, debounceDelay),
        [debounceDelay, setFilters, setFilter]
    );

    // We must reset the filter every time the value changes to ensure we
    // display at least some choices even if the input has a value.
    // Otherwise, it would only display the currently selected one and the user
    // would have to first clear the input before seeing any other choices
    const currentValue = useRef(field.value);
    useEffect(() => {
        if (!isEqual(currentValue.current, field.value)) {
            currentValue.current = field.value;
            debouncedSetFilter('');
        }
    }, [field.value]); // eslint-disable-line

    const {
        getCreateItem,
        handleChange: handleChangeWithCreateSupport,
        createElement,
        createId,
        getOptionDisabled: getOptionDisabledWithCreateSupport,
    } = useSupportCreateSuggestion({
        create,
        createLabel,
        createItemLabel,
        createValue,
        createHintValue,
        handleChange,
        filter: filterValue,
        onCreate,
        optionText,
    });

    const getOptionDisabled = useCallback(
        option => {
            return (
                getOptionDisabledWithCreateSupport(option) ||
                (getOptionDisabledProp && getOptionDisabledProp(option))
            );
        },
        [getOptionDisabledProp, getOptionDisabledWithCreateSupport]
    );

    const getOptionLabel = useCallback(
        (option: any, isListItem: boolean = false) => {
            // eslint-disable-next-line eqeqeq
            if (option == undefined) {
                return '';
            }

            // Value selected with enter, right from the input
            if (typeof option === 'string') {
                return option;
            }

            if (option?.id === createId) {
                return get(
                    option,
                    typeof optionText === 'string' ? optionText : 'name'
                );
            }

            if (!isListItem && option[optionValue || 'id'] === emptyValue) {
                return get(
                    option,
                    typeof optionText === 'string' ? optionText : 'name'
                );
            }

            if (!isListItem && inputText !== undefined) {
                return inputText(option);
            }

            return getChoiceText(option);
        },
        [
            getChoiceText,
            inputText,
            createId,
            optionText,
            optionValue,
            emptyValue,
        ]
    );

    const finalOnBlur = useCallback(
        (event): void => {
            if (clearOnBlur && !multiple) {
                const optionLabel = getOptionLabel(selectedChoice);
                if (!isEqual(optionLabel, filterValue)) {
                    setFilterValue(optionLabel);
                    debouncedSetFilter('');
                }
            }
            field.onBlur(event);
        },
        [
            clearOnBlur,
            field,
            getOptionLabel,
            selectedChoice,
            filterValue,
            debouncedSetFilter,
            multiple,
        ]
    );

    useEffect(() => {
        if (!multiple) {
            const optionLabel = getOptionLabel(selectedChoice);
            if (typeof optionLabel === 'string') {
                setFilterValue(optionLabel);
            } else {
                throw new Error(
                    'When optionText returns a React element, you must also provide the inputText prop'
                );
            }
        }
    }, [getOptionLabel, multiple, selectedChoice]);

    const handleInputChange: AutocompleteProps<
        OptionType,
        Multiple,
        DisableClearable,
        SupportCreate
    >['onInputChange'] = useEvent((event, newInputValue, reason) => {
        if (
            event?.type === 'change' ||
            !doesQueryMatchSelection(newInputValue)
        ) {
            const createOptionLabel = translate(createItemLabel, {
                item: filterValue,
                _: createItemLabel,
            });
            const isCreate = newInputValue === createOptionLabel;
            const valueToSet = isCreate ? filterValue : newInputValue;
            setFilterValue(valueToSet);
            debouncedSetFilter(newInputValue);
        }
        if (reason === 'clear') {
            setFilterValue('');
            debouncedSetFilter('');
        }
        onInputChange?.(event, newInputValue, reason);
    });

    const doesQueryMatchSelection = useCallback(
        (filter: string) => {
            let selectedItemTexts;

            if (multiple) {
                selectedItemTexts = selectedChoice.map(item =>
                    getOptionLabel(item)
                );
            } else {
                selectedItemTexts = [getOptionLabel(selectedChoice)];
            }

            return selectedItemTexts.includes(filter);
        },
        [getOptionLabel, multiple, selectedChoice]
    );
    const doesQueryMatchSuggestion = useCallback(
        filter => {
            const hasOption = finalChoices
                ? finalChoices.some(choice => getOptionLabel(choice) === filter)
                : false;

            return doesQueryMatchSelection(filter) || hasOption;
        },
        [finalChoices, getOptionLabel, doesQueryMatchSelection]
    );

    const filterOptions = (options, params) => {
        let filteredOptions =
            isFromReference || // When used inside a reference, AutocompleteInput shouldn't do the filtering as it's done by the reference input
            matchSuggestion || // When using element as optionText (and matchSuggestion), options are filtered by getSuggestions, so they shouldn't be filtered here
            limitChoicesToValue // When limiting choices to values (why? it's legacy!), options are also filtered by getSuggestions, so they shouldn't be filtered here
                ? options
                : defaultFilterOptions(options, params); // Otherwise, we let Material UI's Autocomplete do the filtering

        // add create option if necessary
        const { inputValue } = params;
        if (onCreate || create) {
            if (inputValue === '' && filterValue === '' && createLabel) {
                // create option with createLabel
                filteredOptions = filteredOptions.concat(getCreateItem(''));
            } else if (
                inputValue &&
                filterValue &&
                !doesQueryMatchSuggestion(filterValue)
            ) {
                filteredOptions = filteredOptions.concat(
                    // create option with createItemLabel
                    getCreateItem(inputValue)
                );
            }
        }

        return filteredOptions;
    };

    const handleAutocompleteChange = useCallback(
        (event: any, newValue: any, reason: AutocompleteChangeReason) => {
            // This prevents auto-submitting a form inside a dialog passed to the `create` prop
            event.preventDefault();
            if (reason === 'createOption') {
                // When users press the enter key after typing a new value, we can handle it as if they clicked on the create option
                handleChangeWithCreateSupport(
                    getCreateItem(
                        Array.isArray(newValue)
                            ? newValue[newValue.length - 1]
                            : newValue
                    )
                );
                return;
            }
            handleChangeWithCreateSupport(
                newValue != null ? newValue : emptyValue
            );
        },
        [emptyValue, getCreateItem, handleChangeWithCreateSupport]
    );

    const oneSecondHasPassed = useTimeout(1000, filterValue);

    const suggestions = useMemo(() => {
        if (!isFromReference && (matchSuggestion || limitChoicesToValue)) {
            return getSuggestions(filterValue);
        }
        return finalChoices?.slice(0, suggestionLimit) || [];
    }, [
        finalChoices,
        filterValue,
        getSuggestions,
        limitChoicesToValue,
        matchSuggestion,
        suggestionLimit,
        isFromReference,
    ]);

    const isOptionEqualToValue = (option, value) => {
        return String(getChoiceValue(option)) === String(getChoiceValue(value));
    };
    const renderHelperText = !!fetchError || helperText !== false || invalid;

    const handleInputRef = useForkRef(field.ref, TextFieldProps?.inputRef);
    return (
        <>
            <StyledAutocomplete
                className={clsx('ra-input', `ra-input-${source}`, className)}
                clearText={translate(clearText, { _: clearText })}
                closeText={translate(closeText, { _: closeText })}
                openOnFocus
                openText={translate(openText, { _: openText })}
                id={id}
                isOptionEqualToValue={isOptionEqualToValue}
                filterSelectedOptions
                disabled={disabled || readOnly}
                renderInput={params => {
                    const mergedTextFieldProps = {
                        readOnly,
                        ...params.InputProps,
                        ...TextFieldProps?.InputProps,
                    };
                    // @ts-expect-error slotProps do not yet exist in MUI v5
                    const mergedSlotProps = TextFieldProps?.slotProps
                        ? {
                              slotProps: {
                                  // @ts-expect-error slotProps do not yet exist in MUI v5
                                  ...TextFieldProps?.slotProps,
                                  input: {
                                      readOnly,
                                      ...params.InputProps,
                                      // @ts-expect-error slotProps do not yet exist in MUI v5
                                      ...TextFieldProps?.slotProps?.input,
                                  },
                              },
                          }
                        : undefined;
                    return (
                        <TextField
                            name={field.name}
                            label={
                                label !== '' && label !== false ? (
                                    <FieldTitle
                                        label={label}
                                        source={source}
                                        resource={resourceProp}
                                        isRequired={isRequired}
                                    />
                                ) : null
                            }
                            error={!!fetchError || invalid}
                            helperText={
                                renderHelperText ? (
                                    <InputHelperText
                                        error={
                                            error?.message ||
                                            fetchError?.message
                                        }
                                        helperText={helperText}
                                    />
                                ) : null
                            }
                            margin={margin}
                            variant={variant}
                            className={clsx({
                                [AutocompleteInputClasses.textField]: true,
                                [AutocompleteInputClasses.emptyLabel]:
                                    label === false || label === '',
                            })}
                            {...params}
                            {...TextFieldProps}
                            InputProps={mergedTextFieldProps}
                            {...mergedSlotProps}
                            size={size}
                            inputRef={handleInputRef}
                        />
                    );
                }}
                multiple={multiple}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                        // We have to extract the key because react 19 does not allow to spread the key prop
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                            <Chip
                                label={
                                    isValidElement(optionText)
                                        ? inputText
                                            ? inputText(option)
                                            : ''
                                        : getChoiceText(option)
                                }
                                size="small"
                                key={key}
                                {...tagProps}
                            />
                        );
                    })
                }
                noOptionsText={
                    typeof noOptionsText === 'string'
                        ? translate(noOptionsText, { _: noOptionsText })
                        : noOptionsText
                }
                selectOnFocus
                clearOnBlur={clearOnBlur}
                {...sanitizeInputRestProps(rest)}
                freeSolo={!!create || !!onCreate}
                handleHomeEndKeys={!!create || !!onCreate}
                filterOptions={filterOptions}
                options={
                    shouldRenderSuggestions == undefined || // eslint-disable-line eqeqeq
                    shouldRenderSuggestions(filterValue)
                        ? suggestions
                        : []
                }
                getOptionLabel={getOptionLabel}
                inputValue={filterValue}
                loading={
                    isPending &&
                    (!finalChoices || finalChoices.length === 0) &&
                    oneSecondHasPassed
                }
                value={selectedChoice}
                onChange={handleAutocompleteChange}
                onBlur={finalOnBlur}
                onInputChange={handleInputChange}
                renderOption={(props, record: RaRecord) => {
                    // We have to extract the key because react 19 does not allow to spread the key prop
                    const { key: ignoredKey, ...rest } = props;
                    // We don't use MUI key which is generated from the option label because we may have options with the same label but with different values
                    const key = getChoiceValue(record);
                    const optionLabel = getOptionLabel(record, true);

                    return (
                        <li key={key} {...rest}>
                            {optionLabel === '' ? ' ' : optionLabel}
                        </li>
                    );
                }}
                getOptionDisabled={getOptionDisabled}
            />
            {createElement}
        </>
    );
};

const PREFIX = 'RaAutocompleteInput';

export const AutocompleteInputClasses = {
    textField: `${PREFIX}-textField`,
    emptyLabel: `${PREFIX}-emptyLabel`,
};

const StyledAutocomplete = styled(Autocomplete, {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
    [`& .${AutocompleteInputClasses.textField}`]: {
        minWidth: theme.spacing(20),
    },
    [`& .${AutocompleteInputClasses.emptyLabel} .MuiOutlinedInput-root legend`]:
        {
            width: 0,
        },
}));

// @ts-ignore
export interface AutocompleteInputProps<
    OptionType extends any = RaRecord,
    Multiple extends boolean | undefined = false,
    DisableClearable extends boolean | undefined = false,
    SupportCreate extends boolean | undefined = false,
> extends Omit<CommonInputProps, 'source' | 'onChange'>,
        Omit<ChoicesProps, 'disableValue'>,
        UseSuggestionsOptions,
        Omit<SupportCreateSuggestionOptions, 'handleChange' | 'optionText'>,
        Omit<
            AutocompleteProps<
                OptionType,
                Multiple,
                DisableClearable,
                SupportCreate
            >,
            'onChange' | 'options' | 'renderInput'
        > {
    children?: ReactNode;
    debounce?: number;
    emptyText?: string;
    emptyValue?: any;
    filterToQuery?: (searchText: string) => any;
    inputText?: (option: any) => string;
    onChange?: (
        // We can't know upfront what the value type will be
        value: Multiple extends true ? any[] : any,
        // We return an empty string when the input is cleared in single mode
        record: Multiple extends true ? OptionType[] : OptionType | ''
    ) => void;
    setFilter?: (value: string) => void;
    shouldRenderSuggestions?: any;
    // Source is optional as AutocompleteInput can be used inside a ReferenceInput that already defines the source
    source?: string;
    TextFieldProps?: TextFieldProps;
}

/**
 * Returns the selected choice (or choices if multiple) by matching the input value with the choices.
 */
const useSelectedChoice = <
    OptionType extends any = RaRecord,
    Multiple extends boolean | undefined = false,
    DisableClearable extends boolean | undefined = false,
    SupportCreate extends boolean | undefined = false,
>(
    value: any,
    {
        choices,
        multiple,
        optionValue,
    }: AutocompleteInputProps<
        OptionType,
        Multiple,
        DisableClearable,
        SupportCreate
    >
) => {
    const selectedChoiceRef = useRef(
        getSelectedItems(choices, value, optionValue, multiple)
    );
    const [selectedChoice, setSelectedChoice] = useState<RaRecord | RaRecord[]>(
        () => getSelectedItems(choices, value, optionValue, multiple)
    );

    // As the selected choices are objects, we want to ensure we pass the same
    // reference to the Autocomplete as it would reset its filter value otherwise.
    useEffect(() => {
        const newSelectedItems = getSelectedItems(
            choices,
            value,
            optionValue,
            multiple
        );

        if (
            !areSelectedItemsEqual(
                selectedChoiceRef.current,
                newSelectedItems,
                optionValue,
                multiple
            )
        ) {
            selectedChoiceRef.current = newSelectedItems;
            setSelectedChoice(newSelectedItems);
        }
    }, [choices, value, multiple, optionValue]);
    return selectedChoice || null;
};

const getSelectedItems = (
    choices: RaRecord[] = [],
    value,
    optionValue = 'id',
    multiple
) => {
    if (multiple) {
        return (Array.isArray(value ?? []) ? value : [value])
            .map(item =>
                choices.find(
                    choice => String(item) === String(get(choice, optionValue))
                )
            )
            .filter(item => !!item);
    }
    return (
        choices.find(
            choice => String(get(choice, optionValue)) === String(value)
        ) || ''
    );
};

const areSelectedItemsEqual = (
    selectedChoice: RaRecord | RaRecord[],
    newSelectedChoice: RaRecord | RaRecord[],
    optionValue = 'id',
    multiple?: boolean
) => {
    if (multiple) {
        const selectedChoiceArray = (selectedChoice as RaRecord[]) ?? [];
        const newSelectedChoiceArray = (newSelectedChoice as RaRecord[]) ?? [];
        if (selectedChoiceArray.length !== newSelectedChoiceArray.length) {
            return false;
        }
        const equalityArray = selectedChoiceArray.map(choice =>
            newSelectedChoiceArray.some(
                newChoice =>
                    get(newChoice, optionValue) === get(choice, optionValue)
            )
        );
        return !equalityArray.some(item => item === false);
    }
    return (
        get(selectedChoice, optionValue) === get(newSelectedChoice, optionValue)
    );
};

const DefaultFilterToQuery = searchText => ({ q: searchText });

declare module '@mui/material/styles' {
    interface ComponentNameToClassKey {
        RaAutocompleteInput: 'root' | 'textField';
    }

    interface ComponentsPropsList {
        RaAutocompleteInput: Partial<AutocompleteInputProps>;
    }

    interface Components {
        RaAutocompleteInput?: {
            defaultProps?: ComponentsPropsList['RaAutocompleteInput'];
            styleOverrides?: ComponentsOverrides<
                Omit<Theme, 'components'>
            >['RaAutocompleteInput'];
        };
    }
}
