import * as React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded overflow-hidden ${className || ''}`}
      style={{
        backgroundColor: '#1E222D',
        border: '1px solid #2A2E39',
        ...style,
      }}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 px-4 py-3 ${className || ''}`}
      style={{
        borderBottom: '1px solid #2A2E39',
        ...style,
      }}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, style, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-sm font-semibold tracking-wide uppercase ${className || ''}`}
      style={{
        color: '#FFFFFF',
        letterSpacing: '0.06em',
        ...style,
      }}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-4 ${className || ''}`}
      style={style}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }