import * as React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-xl border-white/10 bg-[#1a1f2d] 
                   text-white/90 placeholder:text-white/30 px-4 py-2 text-sm 
                   shadow-[0_0_10px_rgba(59,130,246,0.1)] backdrop-blur-lg
                   transition-all duration-200
                   focus:shadow-[0_0_15px_rgba(59,130,246,0.2)]
                   focus:border-blue-500/30 focus:ring-2 focus:ring-blue-500/20 
                   focus-visible:outline-none focus-visible:ring-1 
                   focus-visible:ring-blue-500/30
                   disabled:cursor-not-allowed disabled:opacity-50
                   ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }