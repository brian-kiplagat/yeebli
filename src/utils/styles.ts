import { Attributes, COMPONENT_PREFIX, States } from './constants';

/**
 * Creates the component's CSS using the current attribute prefix
 * This ensures the styling always matches the attribute names
 */
export const createMultiSelectStyles = (): string => `
[${Attributes.CONTAINER}] {
  position: relative;
  width: 100%;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  font-size: 14px;
}

[${Attributes.WRAPPER}] {
  position: relative;
  width: 100%;
}

[${Attributes.INPUT_WRAPPER}] {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 38px;
  padding: 2px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  cursor: text;
  transition: all 0.2s ease;
}

[${Attributes.WRAPPER}]:hover [${Attributes.INPUT_WRAPPER}] {
  border-color: #9ca3af;
}

[${Attributes.WRAPPER}][${States.FOCUSED}] [${Attributes.INPUT_WRAPPER}] {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
  outline: none;
}

[${Attributes.WRAPPER}][${States.DISABLED}] [${Attributes.INPUT_WRAPPER}] {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

[${Attributes.WRAPPER}][${States.READONLY}] [${Attributes.INPUT_WRAPPER}] {
  background-color: #f9fafb;
  cursor: default;
}

[${Attributes.WRAPPER}][${States.INVALID}] [${Attributes.INPUT_WRAPPER}] {
  border-color: #ef4444;
}

[${Attributes.INPUT}] {
  flex: 1;
  min-width: 60px;
  width: calc(100% - 48px); /* Account for the buttons */
  height: 28px;
  margin: 2px;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: inherit;
}

[${Attributes.WRAPPER}][${States.DISABLED}] [${Attributes.INPUT}],
[${Attributes.WRAPPER}][${States.READONLY}] [${Attributes.INPUT}] {
  cursor: default;
}

[${Attributes.TOGGLE}],
[${Attributes.CLEAR}] {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s ease;
}

[${Attributes.TOGGLE}]:hover,
[${Attributes.CLEAR}]:hover {
  color: #111827;
}

[${Attributes.WRAPPER}][${States.DISABLED}] [${Attributes.TOGGLE}],
[${Attributes.WRAPPER}][${States.DISABLED}] [${Attributes.CLEAR}] {
  pointer-events: none;
  opacity: 0.5;
}

[${Attributes.CLEAR}] {
  font-size: 16px;
}

/* Modified to display below input field */
[${Attributes.SELECTED}] {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
  width: 100%;
  min-height: 8px; /* Give some height even when empty */
}

[${Attributes.TAG}] {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  margin: 2px 0;
  border-radius: 4px;
  background-color: #e5e7eb;
  font-size: 13px;
  line-height: 1.5;
  transition: background-color 0.2s ease;
}

[${Attributes.TAG}]:hover {
  background-color: #d1d5db;
}

[${Attributes.WRAPPER}][${States.DISABLED}] [${Attributes.TAG}],
[${Attributes.WRAPPER}][${States.READONLY}] [${Attributes.TAG}] {
  opacity: 0.8;
}

[${Attributes.TAG_LABEL}] {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[${Attributes.TAG_REMOVE}] {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

[${Attributes.TAG_REMOVE}]:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #111827;
}

[${Attributes.COUNT}] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background-color: #2563eb;
  color: white;
  font-size: 11px;
  font-weight: 500;
}

[${Attributes.DROPDOWN}] {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 4px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

[${Attributes.OPTION}] {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

[${Attributes.OPTION}]:hover:not([${States.DISABLED}]) {
  background-color: #f3f4f6;
}

[${Attributes.OPTION}][${States.ACTIVE}]:not([${States.DISABLED}]) {
  background-color: #e5e7eb;
}

[${Attributes.OPTION}][${States.DISABLED}] {
  opacity: 0.5;
  cursor: not-allowed;
  color: #9ca3af;
}

[${Attributes.EMPTY}] {
  padding: 8px 12px;
  color: #6b7280;
  text-align: center;
}

[${Attributes.CREATE}] {
  margin-left: 4px;
  border: none;
  background: none;
  color: #2563eb;
  font-weight: 500;
  cursor: pointer;
}

[${Attributes.CREATE}]:hover {
  text-decoration: underline;
}

[${Attributes.ERROR}] {
  margin-top: 4px;
  color: #ef4444;
  font-size: 12px;
}

/* Custom styles for specific elements */
#skills-example [${Attributes.TAG}] {
  background-color: #e0f2fe;
  border: 1px solid #bae6fd;
  color: #0369a1;
}

#skills-example [${Attributes.TAG_REMOVE}] {
  color: #0369a1;
}

#skills-example [${Attributes.TAG_REMOVE}]:hover {
  background-color: rgba(3, 105, 161, 0.1);
}
`;

/**
 * Injects the MultiSelect styles into the document
 * This should be called once when the application initializes
 */
export const injectMultiSelectStyles = (): void => {
  // Check if we've already injected the styles
  const styleId = `${COMPONENT_PREFIX}-styles`;
  if (document.getElementById(styleId)) {
    return;
  }

  // Create the style element
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = createMultiSelectStyles();

  // Append to document head
  document.head.appendChild(styleElement);
};
