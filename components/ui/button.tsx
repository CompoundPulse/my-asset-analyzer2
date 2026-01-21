import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center 
        relative px-6 py-2 h-10
        bg-[#1a1f2d] border border-blue-500/30 text-white 
        rounded-xl overflow-hidden
        shadow-[0_0_15px_rgba(59,130,246,0.5)] 
        hover:shadow-[0_0_20px_rgba(59,130,246,0.7)]
        transition-all duration-300 hover:bg-[#1e2435]
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-blue-500/50 
        disabled:pointer-events-none disabled:opacity-50
        group ${className || ''}`}
        ref={ref}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent 
        via-white/5 to-transparent transform translate-x-[-100%] 
        group-hover:translate-x-[100%] transition-transform duration-1000"/>
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }