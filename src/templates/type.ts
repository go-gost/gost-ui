export type Template = {
  label: string | { [key: string]: string };
  json: string;
  cli?: string;
  children?: Template[];
};
