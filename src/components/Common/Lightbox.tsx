import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {mediaPath, SafePhoto, setStyles} from "../../util"
import SafeImage from "./SafeImage"
import {GallerySizes} from "../../constants/MediaSizes"
import { cFaArrow, cFaCross } from "../../constants/CustomFontAwesome"
import { useTranslation } from "react-i18next"
import { AnimatedSafePhoto } from "./AnimatedLightbox"
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

export interface SidebarProps<T extends SafePhoto> {
    currentImage: T
}

type LightboxProps<T extends AnimatedSafePhoto> = {
    animated?: boolean
    showImage?: boolean
    initialIndex: number
    firstImageCreatedCallback?: (element: HTMLDivElement, photo: AnimatedSafePhoto) => void
    photos: T[]
    Sidebar?: React.FC<SidebarProps<T>>
    gallery?: boolean
    onClose: () => void
    onChange?: (index: number) => void
}
const Lightbox = <T extends AnimatedSafePhoto>(props: LightboxProps<T>) => {
    const { photos, animated, showImage, firstImageCreatedCallback, initialIndex, Sidebar, gallery, onClose, onChange } = props
    const [currentIndex, _setCurrentIndex] = useState<number>(initialIndex)
    const { t } = useTranslation("common")

    const currentPhoto = useMemo(() => photos[currentIndex], [photos, currentIndex])
    const nextPhoto = useMemo(() => currentIndex + 1 < photos.length && photos[currentIndex + 1], [photos, currentIndex])
    const prevPhoto = useMemo(() => currentIndex - 1 >= 0 && photos[currentIndex - 1], [photos, currentIndex])

    const rightPanel = useRef<HTMLDivElement>(null)
    const sidePanel = useMemo(() => Sidebar && (
        <div
            className="md:bg-white flex-shrink-0 w-full md:w-96 rounded-t-xl md:rounded-none md:rounded-tl-md md:rounded-bl-md overflow-auto md:block z-50 bg-neutral-500/50"
            ref={rightPanel}
        >
            <Sidebar currentImage={currentPhoto} />
        </div>
    ), [Sidebar, currentPhoto])

    useEffect(() =>
        _setCurrentIndex(initialIndex)
    , [initialIndex])

    const photoRef = useRef<HTMLDivElement>(null)
    const prevPhotoRef = useRef<HTMLDivElement>(null)
    const nextPhotoRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fnc = (event: KeyboardEvent) => {
            switch (event.key) {
                case "Escape":
                    onClose()
                    break
                case "ArrowRight":
                    setCurrentIndex(initialIndex => Math.min(photos.length - 1, initialIndex + 1))
                    break
                case "ArrowLeft":
                    setCurrentIndex(initialIndex => Math.max(0, initialIndex - 1))
                    break
                default:
                    break
            }
        }
        
        window.addEventListener("keyup", fnc)

        return () => window.removeEventListener("keyup", fnc)
    }, [photos.length])

    const resize = useCallback((photo: AnimatedSafePhoto, ref: React.RefObject<HTMLDivElement>) => {
        if (!ref.current)
            return
        const ratio = photo.width / photo.height

        const lbHeight = window.innerHeight
        const rpWidth = window.innerWidth >= 768 ?
            rightPanel?.current?.getBoundingClientRect().width ?? 0 :
            0

        const lbWidth = window.innerWidth - rpWidth
        const lbRatio = lbWidth / lbHeight

        const style = ref.current.style

        if (ratio > lbRatio) {
            style.width = `${lbWidth}px`
            style.height = `${lbWidth / ratio}px`
        } else {
            style.width = `${ratio * lbHeight}px`
            style.height = `${lbHeight}px`
        }
    }, [])

    const [, setCallbackCalled] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            if (currentPhoto && photoRef.current)
                resize(currentPhoto, photoRef)
            if (nextPhoto && nextPhotoRef.current)
                resize(nextPhoto, nextPhotoRef)
            if (prevPhoto && prevPhotoRef.current)
                resize(prevPhoto, prevPhotoRef)
        }
        handleResize()

        setCallbackCalled(called => {
            if (!called)
                requestAnimationFrame(_ => firstImageCreatedCallback?.(photoRef.current!, currentPhoto))
            return true
        })

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [currentPhoto, rightPanel, resize, photoRef.current, nextPhotoRef.current, prevPhotoRef.current])

    const setCurrentIndex = useCallback((fct: (index: number) => number) => {
        setBigZoom(false)

        let _onChange = onChange
        _setCurrentIndex(index => {
            const result = fct(index)

            const currentOnChange = _onChange
            _onChange = undefined

            if (currentOnChange)
                currentOnChange(result)
            return result
        })
        
    }, [initialIndex, onChange])

    const [zooming, setZooming] = useState(false)

    const [bigZoom, setBigZoom] = useState(false)

    const zoomStart = useCallback((event: ReactZoomPanPinchRef) => {
        setZooming(true)
    }, [])
    const zoomEnd = useCallback((event: ReactZoomPanPinchRef) => {
        const scale = event.state.scale
        setBigZoom(bigZoom => bigZoom || scale > 2)
        setZooming(scale > 1)
    }, [])

    useEffect(() =>
        setBigZoom(false)
    , [currentIndex])

    const panStop = useCallback((event: ReactZoomPanPinchRef) => {
        if ([100, -100].includes(event.state.positionY) && Math.abs(event.state.positionX) < 50)
            onClose()

        zoomEnd(event)
    }, [onClose, zoomEnd])

    const hideButtons = useMemo(() => showImage == false || zooming, [showImage, zooming])
    const [swiping, setSwiping] = useState(false)

    const touchZoneRef = useRef<HTMLDivElement>(null)


    useEffect(() => {
        const nextPhoto = nextPhotoRef.current!,
            prevPhoto = prevPhotoRef.current!,
            currPhoto = photoRef.current!
        
        if (nextPhoto)
            nextPhoto.style.transition = nextPhoto.style.transform = ""
        if (prevPhoto)
            prevPhoto.style.transition = prevPhoto.style.transform = ""
        currPhoto!.style.transition = currPhoto!.style.transform = ""
    }, [currentIndex])

    useEffect(() => {
        const element = touchZoneRef.current!

        let currentTouch: {
            start: { x: number, y: number }
            last: { x: number, y: number }
            trigger: number
            startTime: number
        } | undefined = undefined

        const cancel = () => {
            const nextPhoto = nextPhotoRef.current!,
                prevPhoto = prevPhotoRef.current!,
                currPhoto = photoRef.current!
            
            currentTouch = undefined
            setSwiping(false)

            if (nextPhoto) {
                nextPhoto.style.transition = "transform .1s ease-out"
                nextPhoto.style.transform = ""
            }
            if (prevPhoto) {
                prevPhoto.style.transition = "transform .1s ease-out"
                prevPhoto.style.transform = ""
            }
            currPhoto!.style.transition = "transform .1s ease-out"
            currPhoto!.style.transform = ""
        }

        const touchStart = (event: TouchEvent) => {
            if (zooming)
                return
            
            if (event.touches.length > 1) {
                cancel()
                return
            }
            
            const touch = event.touches[0]
            currentTouch = {
                start: { x: touch.clientX, y: touch.clientY },
                last: { x: touch.clientX, y: touch.clientY },
                trigger: 5,
                startTime: Date.now(),
            }
        }
        const touchMove = (event: TouchEvent) => {
            if (currentTouch) {
                const touch = event.touches[0]
                const diffX = touch.clientX - currentTouch.last.x,
                    diffY = touch.clientY - currentTouch.last.y;
                
                [currentTouch.last.x, currentTouch.last.y] = [touch.clientX, touch.clientY]
                
                if (currentTouch.trigger > 0) {
                    if (Math.abs(diffX) > Math.abs(diffY) * 1.3) {
                        currentTouch.trigger -= Math.abs(diffX)
                        if (currentTouch.trigger <= 0)
                            setSwiping(true)
                    }
                } else {
                    if (nextPhotoRef.current)
                        nextPhotoRef.current!.style.transform = `translateX(${touch.clientX - currentTouch.start.x - 10}px)`
                    if (prevPhotoRef.current)
                        prevPhotoRef.current!.style.transform = `translateX(${touch.clientX - currentTouch.start.x + 10}px)`
                    
                    photoRef.current!.style.transform = `translateX(${touch.clientX - currentTouch.start.x}px)`
                }
            }
        }
        const touchEnd = (event: TouchEvent) => {
            if (currentTouch && currentTouch.trigger <= 0) {
                const nextPhoto = nextPhotoRef.current!,
                    prevPhoto = prevPhotoRef.current!,
                    currPhoto = photoRef.current!

                const touch = event.changedTouches[0]
                setSwiping(false)
                
                let distance = touch.clientX - currentTouch.start.x

                if (distance > 0) {
                    if (distance > window.innerWidth / 3 || (distance > window.innerWidth / 5 && Date.now() - currentTouch.startTime < 300)) {
                        prevPhoto.style.transition = currPhoto.style.transition = "transform .1s ease-out"
                        prevPhoto.style.transform = currPhoto.style.transform = "translateX(calc(100vw + 10px))"
                        prevPhoto.ontransitionend = () => {
                            prevPhoto.ontransitionend = undefined!
                            requestAnimationFrame(() =>
                                setCurrentIndex(idx => idx - 1)
                            )
                        }
                    } else
                        cancel()
                } else if (distance < 0) {
                    distance = Math.abs(distance)
                    if (distance > window.innerWidth / 3 || (distance > window.innerWidth / 5 && Date.now() - currentTouch.startTime < 300)) {
                        nextPhoto.style.transition = currPhoto.style.transition = "transform .1s ease-out"
                        nextPhoto.style.transform = currPhoto.style.transform = "translateX(calc(-100vw - 10px))"
                        nextPhoto.ontransitionend = () => {
                            nextPhoto.ontransitionend = undefined!
                            requestAnimationFrame(() =>
                                setCurrentIndex(idx => idx + 1)
                            )
                        }
                    } else
                        cancel()
                }
            }
            currentTouch = undefined
        }
        element.addEventListener("touchstart", touchStart, { })
        element.addEventListener("touchmove", touchMove, { capture: true })
        element.addEventListener("touchend", touchEnd)

        return () => {
            element.removeEventListener("touchstart", touchStart)
            element.removeEventListener("touchmove", touchMove)
            element.removeEventListener("touchend", touchEnd)
        }
    }, [])

    return <div
        className={`
            flex flex-wrap md:flex-nowrap md:flex-row 
            w-screen h-screen z-50 
            max-w-full overflow-y-auto md:overflow-hidden 
            ${!animated && " fixed top-0 left-0 bg-black/80 backdrop-blur-md backdrop-filter"}
        `}
    >
        <div className="w-full h-[77vh] md:h-full relative" ref={touchZoneRef}>
            <TransformWrapper
                onZoomStart={zoomStart}
                onZoomStop={zoomEnd}
                onPanningStop={panStop}
                maxPositionX={0}
                alignmentAnimation={{ sizeX: 0 }}
                disabled={swiping}
            >
                <TransformComponent wrapperClass="w-full h-full relative" contentClass="select-none w-full h-full grid relative place-items-center">
                    <div className="w-full h-full absolute top-0 left-0" onClick={onClose}/>
                    <div
                        className={`
                            absolute w-9 h-9 grid place-items-center m-3.5 bg-gray-800 bg-opacity-60
                            hover:bg-gray-700 hover:bg-opacity-50 rounded-full
                            cursor-pointer z-50 top-0 left-0 text-white transition-all duration-300 ${hideButtons && "opacity-0 pointer-events-none"}
                        `}
                        onClick={onClose}
                    >
                        <FontAwesomeIcon icon={cFaCross}/>
                    </div>
                    <div className={"relative m-auto " + (showImage == false && "opacity-0")} ref={photoRef}>
                        {currentPhoto ?
                            <SafeImage
                                skipNsfw={initialIndex == currentIndex}
                                key={currentIndex}
                                nsfw={currentPhoto.nsfw}
                                status={currentPhoto.status}
                                lowQualitySrc={mediaPath(currentPhoto.srcSet as string, GallerySizes.PREVIEW)}
                                src={mediaPath(currentPhoto.srcSet as string, GallerySizes.LIGHTBOX)}
                                highQualitySrc={bigZoom && gallery && mediaPath(currentPhoto.srcSet as string, GallerySizes.DOWNLOAD)}
                                alt={currentPhoto.alt}
                                ratio={currentPhoto.ratio}
                            /> :
                            <div>{t("error")}</div>
                        }
                    </div>
                    {prevPhoto &&
                        <>
                            <div className="m-auto absolute left-[calc(-100vw-10px)]" ref={prevPhotoRef}>
                                <SafeImage
                                    skipNsfw={initialIndex == currentIndex - 1}
                                    key={currentIndex - 1}
                                    nsfw={prevPhoto.nsfw}
                                    status={prevPhoto.status}
                                    src={mediaPath(prevPhoto.srcSet as string, GallerySizes.PREVIEW)}
                                    alt={prevPhoto.alt}
                                    ratio={prevPhoto.ratio}
                                />
                            </div>
                        </>
                    }
                    {nextPhoto &&
                        <>
                            <div className="m-auto absolute left-[calc(100vw+10px)]" ref={nextPhotoRef}>
                                <SafeImage
                                    skipNsfw={initialIndex == currentIndex + 1}
                                    key={currentIndex + 1}
                                    nsfw={nextPhoto.nsfw}
                                    status={nextPhoto.status}
                                    src={mediaPath(nextPhoto.srcSet as string, GallerySizes.PREVIEW)}
                                    alt={nextPhoto.alt}
                                    ratio={nextPhoto.ratio}
                                />
                            </div>
                        </>
                    }
                    {currentIndex + 1 < photos.length &&
                        <div
                            className={`
                                absolute right-0 h-9 w-9 grid place-items-center m-3 bg-gray-800 bg-opacity-60 
                                hover:bg-gray-700 hover:bg-opacity-50 rounded-full cursor-pointer 
                                z-50 transition-all duration-300 ${hideButtons && "opacity-0 pointer-events-none"}
                            `}
                            onClick={() => setCurrentIndex(idx => (idx + 1) % photos.length)}
                        >
                            <FontAwesomeIcon icon={cFaArrow} className="text-white w-4 h-4 transform rotate-180"/>
                        </div>
                    }
                    {currentIndex > 0 && 
                        <div
                            className={`
                                absolute left-0 h-9 w-9 grid place-items-center m-3 bg-gray-800 bg-opacity-60 
                                hover:bg-gray-700 hover:bg-opacity-50 rounded-full cursor-pointer 
                                z-50 transition-all duration-300 ${hideButtons && "opacity-0 pointer-events-none"}
                            `}
                            onClick={() => setCurrentIndex(idx => (idx + photos.length - 1) % photos.length)}
                        >
                            <FontAwesomeIcon icon={cFaArrow} className="text-white w-4 h-4"/>
                        </div>
                    }
                </TransformComponent>
            </TransformWrapper>
        </div>
        {sidePanel}
    </div>
}

export default Lightbox