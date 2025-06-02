import { Attributes, States } from '$utils/constants';
import { injectMultiSelectStyles } from '$utils/styles';

// Static flag to track if styles have been injected
let stylesInjected = false;

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  title?: string;
}

export interface AsyncMultiSelectConfig {
  // Required
  container: HTMLElement;
  options: Option[];

  // Appearance
  name?: string;
  placeholder?: string;
  className?: string;
  maxWidth?: string;
  maxHeight?: string;

  // Behavior
  selected?: string[];
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  allowCreation?: boolean;
  hideDropdownOnSelect?: boolean;
  maxItems?: number;
  maxTags?: number;

  // Validation
  formAssociated?: boolean;
  validationMessage?: string;
  customValidation?: (selected: string[]) => { valid: boolean; message: string } | null;

  // Callbacks
  onChange?: (selected: string[], instance: AsyncMultiSelect) => void;
  onOpen?: (instance: AsyncMultiSelect) => void;
  onClose?: (instance: AsyncMultiSelect) => void;
  onCreateOption?: (value: string, instance: AsyncMultiSelect) => Option | Promise<Option> | void;
  onFocus?: (instance: AsyncMultiSelect) => void;
  onBlur?: (instance: AsyncMultiSelect) => void;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  event_id: number;
  registered_date: string | null;
  membership_active: boolean;
  form_identifier: string;
  host_id: number;
  token: string;
  created_at: string;
  updated_at: string;
  status_identifier: string;
  lead_status: string | null;
  dates: string | null;
  source_url: string | null;
  membership_level: string | null;
}

interface Event {
  id: number;
  event_name: string;
  event_description: string;
  event_type: string;
  asset_id: number;
  created_at: string;
  status: string;
  live_video_url: string;
  success_url: string;
  instructions: string;
  landing_page_url: string;
  calendar_url: string | null;
  live_venue_address: string;
  updated_at: string;
  host_id: number;
}

type SearchResult = Lead | Event;

export class AsyncMultiSelect {
  private container: HTMLElement;
  private options: Option[];
  private selected: string[];
  private inputElement!: HTMLInputElement;
  private hiddenInput: HTMLInputElement | null = null;
  private dropdownElement!: HTMLDivElement;
  private selectedContainer!: HTMLDivElement;
  private mainWrapper!: HTMLDivElement;
  private isOpen = false;
  private activeIndex = -1;
  private config: AsyncMultiSelectConfig;
  private authToken: string;

  constructor(config: AsyncMultiSelectConfig, authToken: string) {
    // Ensure styles are injected only once
    if (!stylesInjected) {
      injectMultiSelectStyles();
      stylesInjected = true;
    }

    this.config = {
      // Set defaults
      selected: [],
      placeholder: 'Select options...',
      disabled: false,
      readOnly: false,
      required: false,
      clearable: true,
      searchable: true,
      allowCreation: false,
      hideDropdownOnSelect: false,
      formAssociated: false,
      maxHeight: '250px',
      ...config,
    };

    this.container = this.config.container;
    this.options = this.config.options;
    this.selected = this.config.selected || [];
    this.authToken = authToken;

    // Create main elements
    this.container.setAttribute(Attributes.CONTAINER, '');
    if (this.config.className) {
      this.container.className = this.config.className;
    }

    this.createElements();
    this.setupEventListeners();
    this.render();

    // Set initial state
    if (this.config.disabled) {
      this.disable();
    }

    if (this.config.readOnly) {
      this.setReadOnly(true);
    }
  }

  // Public API methods

  /**
   * Gets the currently selected values
   */
  public getSelected(): string[] {
    return [...this.selected];
  }

  /**
   * Sets the selected values
   */
  public setSelected(values: string[]): void {
    this.selected = values.filter((value) =>
      this.options.some((option) => option.value === value && !option.disabled)
    );
    this.render();
    this.updateFormValue();
    this.config.onChange?.(this.selected, this);
  }

  /**
   * Adds an option to the select
   */
  public addOption(option: Option): void {
    if (!this.options.some((o) => o.value === option.value)) {
      this.options.push(option);
      this.renderDropdown();
    }
  }

  /**
   * Clears all selected values
   */
  public clear(): void {
    this.selected = [];
    this.render();
    this.updateFormValue();
    this.config.onChange?.(this.selected, this);
  }

  /**
   * Opens the dropdown
   */
  public open(): void {
    if (!this.config.disabled && !this.config.readOnly) {
      this.isOpen = true;
      this.renderDropdown();
      this.config.onOpen?.(this);
    }
  }

  /**
   * Closes the dropdown
   */
  public close(): void {
    this.isOpen = false;
    this.activeIndex = -1;
    this.dropdownElement.style.display = 'none';
    this.config.onClose?.(this);
  }

  /**
   * Enables the select
   */
  public enable(): void {
    this.config.disabled = false;
    this.mainWrapper.removeAttribute(States.DISABLED);
    this.inputElement.disabled = false;
    if (this.hiddenInput) {
      this.hiddenInput.disabled = false;
    }
  }

  /**
   * Disables the select
   */
  public disable(): void {
    this.config.disabled = true;
    this.mainWrapper.setAttribute(States.DISABLED, '');
    this.inputElement.disabled = true;
    if (this.hiddenInput) {
      this.hiddenInput.disabled = true;
    }
    this.close();
  }

  /**
   * Sets the readonly state
   */
  public setReadOnly(readOnly: boolean): void {
    this.config.readOnly = readOnly;
    if (readOnly) {
      this.mainWrapper.setAttribute(States.READONLY, '');
      this.inputElement.readOnly = true;
      this.close();
    } else {
      this.mainWrapper.removeAttribute(States.READONLY);
      this.inputElement.readOnly = false;
    }
  }

  /**
   * Validates the current selection
   */
  public validate(): { valid: boolean; message: string } | null {
    if (this.config.required && this.selected.length === 0) {
      return {
        valid: false,
        message: this.config.validationMessage || 'This field is required',
      };
    }

    if (this.config.maxItems && this.selected.length > this.config.maxItems) {
      return {
        valid: false,
        message: `Maximum ${this.config.maxItems} items allowed`,
      };
    }

    if (this.config.customValidation) {
      return this.config.customValidation(this.selected);
    }

    return { valid: true, message: '' };
  }

  /**
   * Destroy the component and remove all event listeners
   */
  public destroy(): void {
    document.removeEventListener('click', this.handleOutsideClick);
    // Remove the component from the DOM
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  // Private methods for internal functionality

  private createElements() {
    // Create main wrapper
    this.mainWrapper = document.createElement('div');
    this.mainWrapper.setAttribute(Attributes.WRAPPER, '');
    if (this.config.maxWidth) {
      this.mainWrapper.style.maxWidth = this.config.maxWidth;
    }

    // Create input wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.setAttribute(Attributes.INPUT_WRAPPER, '');

    // Create input
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.setAttribute(Attributes.INPUT, '');
    this.inputElement.placeholder = this.config.placeholder || 'Select options...';
    if (!this.config.searchable) {
      this.inputElement.readOnly = true;
    }

    // Create hidden input for form association
    if (this.config.formAssociated && this.config.name) {
      this.hiddenInput = document.createElement('input');
      this.hiddenInput.type = 'hidden';
      this.hiddenInput.name = this.config.name;
      this.hiddenInput.value = this.selected.join(',');
      if (this.config.required) {
        this.hiddenInput.required = true;
      }
    }

    // Create dropdown toggle button
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.setAttribute(Attributes.TOGGLE, '');
    toggleButton.setAttribute('aria-label', 'Toggle dropdown');
    toggleButton.innerHTML = '▼';
    toggleButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Create dropdown
    this.dropdownElement = document.createElement('div');
    this.dropdownElement.setAttribute(Attributes.DROPDOWN, '');
    this.dropdownElement.style.display = 'none';
    if (this.config.maxHeight) {
      this.dropdownElement.style.maxHeight = this.config.maxHeight;
    }

    // Create selected items container
    this.selectedContainer = document.createElement('div');
    this.selectedContainer.setAttribute(Attributes.SELECTED, '');

    // Create clear button if clearable
    let clearButton;
    if (this.config.clearable) {
      clearButton = document.createElement('button');
      clearButton.type = 'button';
      clearButton.setAttribute(Attributes.CLEAR, '');
      clearButton.setAttribute('aria-label', 'Clear all selected');
      clearButton.innerHTML = '✕';
      clearButton.style.display = 'none';
      clearButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clear();
      });
    }

    // Append elements
    inputWrapper.appendChild(this.inputElement);
    if (clearButton) {
      inputWrapper.appendChild(clearButton);
    }
    inputWrapper.appendChild(toggleButton);

    this.mainWrapper.appendChild(inputWrapper);
    // Place selectedContainer after inputWrapper
    this.mainWrapper.appendChild(this.selectedContainer);

    if (this.hiddenInput) {
      this.mainWrapper.appendChild(this.hiddenInput);
    }
    this.mainWrapper.appendChild(this.dropdownElement);
    this.container.appendChild(this.mainWrapper);
  }

  private handleOutsideClick = (e: MouseEvent) => {
    if (!this.mainWrapper.contains(e.target as Node)) {
      this.close();
      // Remove focused class
      this.mainWrapper.removeAttribute(States.FOCUSED);
      // Trigger onBlur when clicking outside
      if (this.isOpen) {
        this.config.onBlur?.(this);
      }
    }
  };

  private setupEventListeners() {
    // Input events
    this.inputElement.addEventListener('focus', () => {
      if (!this.config.disabled && !this.config.readOnly) {
        this.open();
        this.mainWrapper.setAttribute(States.FOCUSED, '');
        this.config.onFocus?.(this);
      }
    });

    this.inputElement.addEventListener('blur', () => {
      // Only remove focus if not clicking inside the component
      setTimeout(() => {
        if (!this.mainWrapper.contains(document.activeElement)) {
          this.mainWrapper.removeAttribute(States.FOCUSED);
        }
      }, 100);
    });

    this.inputElement.addEventListener('input', () => {
      if (this.config.searchable) {
        this.handleInput();
      }
    });

    this.inputElement.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Click outside to close
    document.addEventListener('click', this.handleOutsideClick);
  }

  private toggleDropdown() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private getSearchType(): string {
    const radioButtons = document.querySelectorAll('input[name="MessageRadio"]');
    for (const radio of radioButtons) {
      if (radio instanceof HTMLInputElement && radio.checked) {
        return radio.value;
      }
    }
    return 'name'; // default to name if nothing is selected
  }

  private async handleInput() {
    this.open();

    const searchValue = this.inputElement.value.trim();
    if (searchValue) {
      try {
        const searchType = this.getSearchType();
        const response = await fetch('https://api.3themind.com/v1/lead/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            search_by: searchType,
            search_value: searchValue,
          }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        // Transform the API response to match our Option interface
        if (data.results && Array.isArray(data.results)) {
          // Keep existing options that are already selected
          const existingSelectedOptions = this.options.filter((option) =>
            this.selected.includes(option.value)
          );

          // Add new search results
          const newOptions = data.results.map((result: SearchResult) => {
            if ('name' in result) {
              // It's a Lead
              return {
                value: result.id.toString(),
                label: `${result.name} - ${result.email}`,
                title: `${result.name} - ${result.email}`,
              };
            }
            // It's an Event
            return {
              value: result.id.toString(),
              label: result.event_name,
              title: result.event_description,
            };
          });

          // Combine existing selected options with new search results
          this.options = [...existingSelectedOptions, ...newOptions];
          this.renderDropdown();
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    } else {
      this.renderDropdown();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (this.config.disabled || this.config.readOnly) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.open();
        this.activeIndex = Math.min(this.activeIndex + 1, this.getFilteredOptions().length - 1);
        this.renderDropdown();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.open();
        this.activeIndex = Math.max(this.activeIndex - 1, -1);
        this.renderDropdown();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.isOpen) {
          if (this.activeIndex >= 0) {
            const option = this.getFilteredOptions()[this.activeIndex];
            if (!option.disabled) {
              this.toggleOption(option.value);
            }
          } else if (this.config.allowCreation && this.inputElement.value.trim()) {
            this.createOption(this.inputElement.value.trim());
          }
        } else {
          this.open();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        this.inputElement.blur();
        break;
      case 'Backspace':
        if (this.inputElement.value === '' && this.selected.length > 0) {
          // Remove the last selected item when pressing backspace on empty input
          //this.removeOption(this.selected[this.selected.length - 1]);
        }
        break;
    }
  }

  private getFilteredOptions(): Option[] {
    const input = this.inputElement.value.toLowerCase();

    if (!this.config.searchable || input === '') {
      return this.options.filter((option) => !this.selected.includes(option.value));
    }

    return this.options.filter(
      (option) =>
        !this.selected.includes(option.value) && option.label.toLowerCase().includes(input)
    );
  }

  private toggleOption(value: string) {
    const option = this.options.find((o) => o.value === value);
    if (!option || option.disabled) return;

    if (this.selected.includes(value)) {
      this.removeOption(value);
    } else {
      this.selectOption(value);
    }
  }

  private selectOption(value: string) {
    const option = this.options.find((o) => o.value === value);
    if (!option || option.disabled) return;

    // Check if we've exceeded the maximum number of selections
    if (this.config.maxItems && this.selected.length >= this.config.maxItems) {
      return;
    }

    if (!this.selected.includes(value)) {
      this.selected.push(value);
      this.inputElement.value = '';
      this.render();
      this.updateFormValue();
      this.config.onChange?.(this.selected, this);

      if (this.config.hideDropdownOnSelect) {
        this.close();
      } else {
        this.renderDropdown();
      }
    }
  }

  private removeOption(value: string) {
    this.selected = this.selected.filter((v) => v !== value);
    this.render();
    this.updateFormValue();
    this.config.onChange?.(this.selected, this);
    this.open();
  }

  private async createOption(value: string) {
    if (this.config.onCreateOption) {
      try {
        const newOption = await Promise.resolve(this.config.onCreateOption(value, this));
        if (newOption) {
          this.addOption(newOption);
          this.selectOption(newOption.value);
        }
      } catch (error) {
        console.error('Error creating option:', error);
      }
    } else {
      // Default behavior: create an option with the same value and label
      const newOption = { value, label: value };
      this.addOption(newOption);
      this.selectOption(value);
    }

    this.inputElement.value = '';
  }

  private updateFormValue() {
    if (this.hiddenInput) {
      this.hiddenInput.value = this.selected.join(',');
    }

    // Update clear button visibility
    const clearButton = this.mainWrapper.querySelector<HTMLButtonElement>(`[${Attributes.CLEAR}]`);
    if (clearButton) {
      clearButton.style.display = this.selected.length > 0 ? 'block' : 'none';
    }
  }

  private renderDropdown() {
    if (!this.isOpen) {
      this.dropdownElement.style.display = 'none';
      return;
    }

    const filteredOptions = this.getFilteredOptions();

    if (filteredOptions.length === 0) {
      this.close();
      return;
    }

    this.dropdownElement.style.display = 'block';
    this.dropdownElement.innerHTML = '';

    filteredOptions.forEach((option, index) => {
      const optionElement = document.createElement('div');
      optionElement.setAttribute(Attributes.OPTION, '');

      if (option.disabled) {
        optionElement.setAttribute(States.DISABLED, '');
      }

      if (index === this.activeIndex) {
        optionElement.setAttribute(States.ACTIVE, '');
      }

      optionElement.textContent = option.label;

      if (option.title) {
        optionElement.title = option.title;
      }

      optionElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!option.disabled) {
          this.toggleOption(option.value);
        }
      });

      this.dropdownElement.appendChild(optionElement);
    });

    if (filteredOptions.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.setAttribute(Attributes.EMPTY, '');

      if (this.config.searchable && this.inputElement.value.trim() && this.config.allowCreation) {
        emptyMessage.innerHTML = `
          No options found. 
          <button type="button" ${Attributes.CREATE}>
            Create "${this.inputElement.value.trim()}"
          </button>
        `;

        const createButton = emptyMessage.querySelector(`[${Attributes.CREATE}]`);
        if (createButton) {
          createButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.createOption(this.inputElement.value.trim());
          });
        }
      } else {
        emptyMessage.textContent = 'No options found';
      }

      this.dropdownElement.appendChild(emptyMessage);
    }
  }

  private render() {
    // Render selected items
    this.selectedContainer.innerHTML = '';

    // Handle maxTags limit for display
    const displayLimit =
      this.config.maxTags && this.selected.length > this.config.maxTags
        ? this.config.maxTags
        : this.selected.length;

    // Render tags for visible selections
    for (let i = 0; i < displayLimit; i++) {
      const value = this.selected[i];
      const option = this.options.find((o) => o.value === value);

      if (option) {
        const tag = document.createElement('span');
        tag.setAttribute(Attributes.TAG, '');

        // Add accessible attributes
        tag.setAttribute('role', 'listitem');
        tag.setAttribute('aria-label', `Selected: ${option.label}`);

        const labelSpan = document.createElement('span');
        labelSpan.setAttribute(Attributes.TAG_LABEL, '');
        labelSpan.textContent = option.label;
        tag.appendChild(labelSpan);

        if (!this.config.disabled && !this.config.readOnly) {
          const removeButton = document.createElement('button');
          removeButton.type = 'button';
          removeButton.setAttribute(Attributes.TAG_REMOVE, '');
          removeButton.innerHTML = '×';
          removeButton.setAttribute('aria-label', `Remove ${option.label}`);

          removeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removeOption(value);
          });

          tag.appendChild(removeButton);
        }

        this.selectedContainer.appendChild(tag);
      }
    }

    // Show count of additional items if needed
    if (this.config.maxTags && this.selected.length > this.config.maxTags) {
      const extraCount = this.selected.length - this.config.maxTags;
      const countBadge = document.createElement('span');
      countBadge.setAttribute(Attributes.COUNT, '');
      countBadge.textContent = `+${extraCount}`;
      this.selectedContainer.appendChild(countBadge);
    }

    // Update accessibility attributes
    this.selectedContainer.setAttribute('role', 'list');
    this.selectedContainer.setAttribute('aria-label', 'Selected options');

    // Update validation UI if needed
    const validation = this.validate();
    if (validation && !validation.valid) {
      this.mainWrapper.setAttribute(States.INVALID, '');

      // Add or update validation message
      let errorElement = this.container.querySelector(`[${Attributes.ERROR}]`);
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.setAttribute(Attributes.ERROR, '');
        this.container.appendChild(errorElement);
      }

      if (errorElement instanceof HTMLElement) {
        errorElement.textContent = validation.message;
      }
    } else {
      this.mainWrapper.removeAttribute(States.INVALID);

      // Remove error message if it exists
      const errorElement = this.container.querySelector(`[${Attributes.ERROR}]`);
      if (errorElement) {
        errorElement.remove();
      }
    }
  }
}
