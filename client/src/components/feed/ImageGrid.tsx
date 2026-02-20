import { cn } from '@/lib/utils'

interface ImageGridProps {
  images: string[]
}

/**
 * 图片网格组件
 * 根据图片数量显示不同布局：
 * - 1张：16:9横图
 * - 2张：1:1并排
 * - 3张：左边大图(2:3)，右边上下小图
 * - 4张：2×2网格
 */
export function ImageGrid({ images }: ImageGridProps) {
  if (!images || images.length === 0) return null

  const displayImages = images.slice(0, 4)
  const count = displayImages.length

  const getGridClass = () => {
    switch (count) {
      case 1:
        return 'grid-cols-1'
      case 2:
      case 3:
      case 4:
        return 'grid-cols-2'
      default:
        return 'grid-cols-2'
    }
  }

  return (
    <div className={cn('mt-3 grid gap-1 rounded-lg overflow-hidden', getGridClass())}>
      {displayImages.map((img, index) => (
        <div
          key={index}
          className={cn(
            'relative overflow-hidden bg-muted',
            // 1张图片：16:9
            count === 1 && 'aspect-[16/9]',
            // 2张图片：1:1并排
            count === 2 && 'aspect-square',
            // 3张图片：第一张占满左边两行
            count === 3 && index === 0 && 'row-span-2 aspect-[2/3]',
            count === 3 && index !== 0 && 'aspect-square',
            // 4张图片：2×2网格
            count === 4 && 'aspect-square'
          )}
        >
          <img
            src={img}
            alt={`图片 ${index + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  )
}
