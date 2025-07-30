import { ComponentTypes } from '~/data-provider/data-provider/src';
import type { DynamicSettingProps } from '~/data-provider/data-provider/src';
import {
  DynamicCombobox,
  DynamicDropdown,
  DynamicCheckbox,
  DynamicTextarea,
  DynamicSlider,
  DynamicSwitch,
  DynamicInput,
  DynamicTags,
} from './';

export const componentMapping: Record<
  ComponentTypes,
  React.ComponentType<DynamicSettingProps> | undefined
> = {
  [ComponentTypes.Slider]: DynamicSlider,
  [ComponentTypes.Dropdown]: DynamicDropdown,
  [ComponentTypes.Switch]: DynamicSwitch,
  [ComponentTypes.Textarea]: DynamicTextarea,
  [ComponentTypes.Input]: DynamicInput,
  [ComponentTypes.Checkbox]: DynamicCheckbox,
  [ComponentTypes.Tags]: DynamicTags,
  [ComponentTypes.Combobox]: DynamicCombobox,
};
