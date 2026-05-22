import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[hsl(var(--accent-subtle))] text-[hsl(var(--accent-subtle-foreground))] border border-[hsl(var(--accent)/0.2)]',
        success:
          'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.2)]',
        warning:
          'bg-[hsl(var(--warning-subtle))] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.2)]',
        error:
          'bg-[hsl(var(--error-subtle))] text-[hsl(var(--error))] border border-[hsl(var(--error)/0.2)]',
        muted:
          'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]',
        outline:
          'bg-transparent text-[hsl(var(--foreground))] border border-[hsl(var(--border-strong))]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-[hsl(var(--success))]',
            variant === 'warning' && 'bg-[hsl(var(--warning))]',
            variant === 'error' && 'bg-[hsl(var(--error))]',
            (!variant || variant === 'default') && 'bg-[hsl(var(--accent))]',
            variant === 'muted' && 'bg-[hsl(var(--muted-foreground))]'
          )}
        />
      )}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
