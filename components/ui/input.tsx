import * as React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={className || ''}
        style={{
          width: '100%',
          backgroundColor: '#2A2E39',
          border: '1px solid #2A2E39',
          borderRadius: '4px',
          padding: '8px 12px',
          color: '#D1D4DC',
          fontSize: '13px',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          WebkitAppearance: 'none',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#2962FF'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#2A2E39'
          props.onBlur?.(e)
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }