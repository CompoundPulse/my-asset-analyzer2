import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', style, children, disabled, ...props }, ref) => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: 500,
      padding: '7px 14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
      border: 'none',
      outline: 'none',
      whiteSpace: 'nowrap',
      WebkitTapHighlightColor: 'transparent',
    }

    const variants: Record<string, React.CSSProperties> = {
      default: {
        backgroundColor: '#2962FF',
        color: '#FFFFFF',
        border: 'none',
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#787B86',
        border: '1px solid #2A2E39',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#787B86',
        border: '1px solid #2A2E39',
      },
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        style={{ ...base, ...variants[variant], ...style }}
        className={className || ''}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }