import * as React from "react"

const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={`w-full border-collapse bg-white/5 backdrop-blur-lg rounded-xl ${className || ''}`}
        {...props}
      />
    </div>
  )
)

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={`bg-white/5 text-white/80 ${className || ''}`} {...props} />
  )
)

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody 
      ref={ref} 
      className={`bg-transparent divide-y divide-white/10 ${className || ''}`}
      {...props} 
    />
  )
)

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr 
      ref={ref} 
      className={`border-b border-white/10 transition-colors hover:bg-white/5 ${className || ''}`}
      {...props} 
    />
  )
)

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td 
      ref={ref} 
      className={`p-4 text-white/80 ${className || ''}`}
      {...props} 
    />
  )
)

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th 
      ref={ref} 
      className={`p-4 text-left font-medium text-white/90 bg-white/5 first:rounded-tl-xl last:rounded-tr-xl ${className || ''}`}
      {...props} 
    />
  )
)

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead
}