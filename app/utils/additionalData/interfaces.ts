interface IElement {
  id: string;
  key: string;
  name: string;
  type: string;
  treeType: string[];
  registrationType: string[];
  accessType: string;
  subElementId?: string;
}

interface IDropdownOptions {
  key: string;
  value: string;
}

interface IDropdownElement extends IElement {
  defaultValue: string;
  isRequired: boolean;
  dropdownOptions: IDropdownOptions[];
}

interface IInputElement extends IElement {
  defaultValue: string;
  isRequired: boolean;
  regexValidation: string;
  inputType: string;
}

interface IYesNoElement extends IElement {
  defaultValue: boolean;
  isRequired: boolean;
}

export type FormElementType = IElement[] | IDropdownElement[] | IInputElement[] | IYesNoElement[];

export interface IFormData {
  id: string;
  title: string;
  description: string;
  order: number;
  elements: FormElementType;
}

export interface IMetadata {
  id: string;
  key: string;
  value: string;
  order: number;
  accessType: string;
}

export interface IAdditionalDataImport {
  formData: IFormData[];
  metadata: IMetadata[];
  someval: string;
}
