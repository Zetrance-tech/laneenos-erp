import React, { useEffect, useState } from "react";
import Select from "react-select";

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  defaultValue?: Option;
  className?: string;
  styles?: any; 
  onChange?: (option: Option | null) => void;
  name?: string;
}

const CommonSelect: React.FC<SelectProps> = ({ options, defaultValue, className,onChange,name}) => {
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(defaultValue);

  const handleChange = (option: Option | null) => {
    setSelectedOption(option || undefined);
    if(onChange) {
      onChange(option);
    }
  };
  useEffect(() => {
    setSelectedOption(defaultValue || undefined);
  }, [defaultValue])
  
  return (
    <Select
     classNamePrefix="react-select"
      className={className}
      // styles={customStyles}
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder="Select"
      name={name}
    />
  );
};

export default CommonSelect;


/// src/core/common/commonSelect.tsx
// import React, { useEffect, useState } from "react";
// import Select, { MultiValue, SingleValue } from "react-select";

// export type Option = {
//   value: string;
//   label: string;
// };

// export interface SelectProps {
//   options: Option[];
//   defaultValue?: Option | Option[]; // Support single or multi default value
//   className?: string;
//   styles?: any;
//   onChange?: (option: SingleValue<Option> | MultiValue<Option>) => void; // Updated typing
//   name?: string;
//   isMulti?: boolean; // Add isMulti prop
//   value?: Option | Option[] | null; // Add value prop
//   placeholder?: string; // Add placeholder prop
// }

// const CommonSelect: React.FC<SelectProps> = ({
//   options,
//   defaultValue,
//   className,
//   onChange,
//   name,
//   isMulti = false,
//   value,
//   placeholder = "Select",
// }) => {
//   const [selectedOption, setSelectedOption] = useState<Option | Option[] | undefined>(
//     defaultValue
//   );

//   useEffect(() => {
//     setSelectedOption(value || defaultValue || (isMulti ? [] : undefined));
//   }, [value, defaultValue, isMulti]);

//   const handleChange = (option: SingleValue<Option> | MultiValue<Option>) => {
//     // Handle single vs multi-select cases
//     const newValue = isMulti
//       ? option
//         ? (Array.isArray(option) ? [...option] : [option]) as Option[]
//         : []
//       : (option as Option | null) || undefined;

//     setSelectedOption(newValue);
//     if (onChange) {
//       onChange(option);
//     }
//   };

//   return (
//     <Select
//       classNamePrefix="react-select"
//       className={className}
//       options={options}
//       value={value || selectedOption}
//       onChange={handleChange}
//       placeholder={placeholder}
//       name={name}
//       isMulti={isMulti}
//     />
//   );
// };

// export default CommonSelect;