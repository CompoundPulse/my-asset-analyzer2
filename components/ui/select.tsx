import * as React from "react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full p-3 rounded-xl bg-[#1a1f2d] border-white/10 text-white/90 
                  placeholder-white/30 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                  transition-all backdrop-blur-lg shadow-[0_0_10px_rgba(59,130,246,0.1)]
                  hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] relative z-50 ${className || ''}`}
      {...props}
    >
      {children}
    </select>
  )
)

const SelectItem = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, children, ...props }, ref) => (
    <option
      ref={ref}
      className={`bg-[#1a1f2d] text-white/90 relative z-[100] ${className || ''}`}
      {...props}
    >
      {children}
    </option>
  )
)
SelectItem.displayName = "SelectItem"

export { Select, SelectItem }