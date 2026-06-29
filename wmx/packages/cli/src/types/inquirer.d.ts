declare module "inquirer" {
  export interface QuestionBase {
    name: string;
    message: string;
    default?: unknown;
  }

  export interface InputQuestion extends QuestionBase {
    type: "input";
    validate?: (value: string) => boolean | string | Promise<boolean | string>;
  }

  export interface ListChoice {
    name: string;
    value: string;
  }

  export interface ListQuestion extends QuestionBase {
    type: "list";
    choices: (string | ListChoice)[];
  }

  export interface ConfirmQuestion extends QuestionBase {
    type: "confirm";
  }

  export interface CheckboxChoice {
    name: string;
    value: string;
    checked?: boolean;
  }

  export interface CheckboxQuestion extends QuestionBase {
    type: "checkbox";
    choices: CheckboxChoice[];
  }

  export type Question = InputQuestion | ListQuestion | ConfirmQuestion | CheckboxQuestion;

  export function prompt<T = Record<string, unknown>>(
    questions: Question[]
  ): Promise<T>;

  const inquirer: {
    prompt: typeof prompt;
  };

  export default inquirer;
}
