import { cn } from '@/lib/utils'

interface TypeFilterProps {
  value: 'ALL' | 'SHORT' | 'ARTICLE'
  onChange: (type: 'ALL' | 'SHORT' | 'ARTICLE') => void
}

const filters = [
  { value: 'ALL', label: '全部' },
  { value: 'SHORT', label: '说说' },
  { value: 'ARTICLE', label: '长文章' },
] as const

/**
 * 类型筛选器组件
 * 用于切换Feed流显示的内容类型
 */
export function TypeFilter({ value, onChange }: TypeFilterProps) {
  return (
    <div className="flex items-center gap-1 border-b bg-background p-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            value === filter.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
