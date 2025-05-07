/**
 * Constants for the MultiSelect component
 *
 * To change the attribute prefix for the entire component:
 * 1. Simply update the COMPONENT_PREFIX value
 * 2. All attributes will automatically use the new prefix
 * 3. Styles will be generated with the new prefix at runtime
 */

// The global attribute prefix for the component
// Change this value to customize the attribute namespace
export const COMPONENT_PREFIX = 'bobby-select';

// Generate attribute constants with the prefix
export const Attributes = {
  CONTAINER: COMPONENT_PREFIX,
  WRAPPER: `${COMPONENT_PREFIX}-wrapper`,
  INPUT_WRAPPER: `${COMPONENT_PREFIX}-input-wrapper`,
  INPUT: `${COMPONENT_PREFIX}-input`,
  DROPDOWN: `${COMPONENT_PREFIX}-dropdown`,
  SELECTED: `${COMPONENT_PREFIX}-selected`,
  TOGGLE: `${COMPONENT_PREFIX}-toggle`,
  CLEAR: `${COMPONENT_PREFIX}-clear`,
  OPTION: `${COMPONENT_PREFIX}-option`,
  TAG: `${COMPONENT_PREFIX}-tag`,
  TAG_LABEL: `${COMPONENT_PREFIX}-tag-label`,
  TAG_REMOVE: `${COMPONENT_PREFIX}-tag-remove`,
  COUNT: `${COMPONENT_PREFIX}-count`,
  EMPTY: `${COMPONENT_PREFIX}-empty`,
  CREATE: `${COMPONENT_PREFIX}-create`,
  ERROR: `${COMPONENT_PREFIX}-error`,
};

// State attributes
export const States = {
  FOCUSED: `${COMPONENT_PREFIX}-focused`,
  ACTIVE: `${COMPONENT_PREFIX}-active`,
  DISABLED: `${COMPONENT_PREFIX}-disabled`,
  READONLY: `${COMPONENT_PREFIX}-readonly`,
  INVALID: `${COMPONENT_PREFIX}-invalid`,
  HIDDEN: `${COMPONENT_PREFIX}-hidden`,
};
