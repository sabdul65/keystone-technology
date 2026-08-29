import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'

interface RevealOwnProps<T extends ElementType> {
  children: ReactNode
  as?: T
  delay?: number
  className?: string
}

type RevealProps<T extends ElementType> = RevealOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof RevealOwnProps<T>>

export function Reveal<T extends ElementType = 'div'>({
  children,
  as,
  delay = 0,
  className = '',
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? 'div') as ElementType
  const { ref, isVisible } = useInView<HTMLElement>()

  return (
    <Tag
      ref={ref}
      className={`reveal ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
