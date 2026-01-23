import type { ComponentPropsWithRef, ElementType } from "react";

type InputProps<T extends ElementType> = {
  label: string;
  id: string;
  as: T;
} & ComponentPropsWithRef<T>;
export default function Input<U extends ElementType>({
  id,
  as,
  label,
  ...props
}: InputProps<U>) {
  const Component = as || "input";
  return (
    <p>
      <label htmlFor={id}>{label}</label>
      <Component id={id} {...props} />
    </p>
  );
}




// import type { ComponentPropsWithRef, ElementType } from "react";

// Generic Input component supporting 'as' prop for different element types

// type InputProps<T extends ElementType> = {
//   label: string;
//   id: string;
//   as: T;
// } & ComponentPropsWithRef<T>;

// export default function Input<U extends ElementType>({
//   id,
//   as,
//   label,
//   ...props
// }: InputProps<U>) {
//   const Component = as || "input";
//   return (
//     <p>
//       <label htmlFor={id} >{label}</label>
//       <Component id={id} {...props}  />
//     </p>
//   );
// }


// className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-blue-900 border-blue-300"
// className="block mb-1 text-sm font-medium text-blue-900"