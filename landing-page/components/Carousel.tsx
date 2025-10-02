import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Keyboard, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/a11y'
import Image from 'next/image'

type Props = {
    images: string[]
    onImageClick?: (src: string) => void
    onSlideChange?: (index: number) => void
    getAlt?: (src: string) => string | undefined
}

export default function Carousel({ images, onImageClick, onSlideChange, getAlt }: Props) {
    return (
        <div className="carousel">
            <Swiper
                modules={[Navigation, Pagination, Keyboard, A11y]}
                slidesPerView={1}
                spaceBetween={16}
                loop={true}
                navigation={true}
                pagination={{ clickable: true }}
                keyboard={{ enabled: true }}
                onSlideChange={(s) => {
                    const idx = (s && typeof (s as any).realIndex === 'number') ? (s as any).realIndex : (s as any).activeIndex
                    if (typeof idx === 'number' && onSlideChange) onSlideChange(idx)
                }}
            >
                {images.map((src: string) => (
                    <SwiperSlide key={src}>
                        <div className="carousel-item" style={{ padding: '0 0.5rem' }} onClick={() => onImageClick && onImageClick(src)}>
                            <Image
                                src={src}
                                alt={getAlt ? (getAlt(src) ?? "Capture d'écran de Kutsum") : "Capture d'écran de Kutsum"}
                                width={1200}
                                height={720}
                                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                                priority={false}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}
