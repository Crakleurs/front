import React, {forwardRef, ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react"
import Loading from "./Loading"
import {useTranslation} from "react-i18next"

const INITIAL_LOADER: Loader = {loading: false, fetch: false, count: 0, over: false}
type Loader = {
    count: number,
    over: boolean,
    loading: boolean
    fetch: boolean
}

export type loaderCallback = (count: number, ...param: any) => Promise<boolean>
export type ScrollerCallback = loaderCallback | [loaderCallback, loaderCallback]

export type InfiniteScrollerRef = {
    resetData: () => void
}

type InfiniteScrollerProps = {
    watch: "UP" | "DOWN" | "BOTH"
    triggerDistance?: number
    callback: ScrollerCallback
    empty?: boolean
    className?: string
    children: ReactNode
    loadingComponent?: React.ReactNode,
    scrollElement?: HTMLElement | null | false,
    block?: boolean
}

const InfiniteScroller = forwardRef<InfiniteScrollerRef, InfiniteScrollerProps>((props, ref) => {
    const {t} = useTranslation("common")
    const {watch, block = false, empty = false,  callback, triggerDistance = 200, loadingComponent, scrollElement, children, className} = props
    const [upCallback, downCallback] = useMemo(() => (Array.isArray(callback) ? callback : [callback, callback]), [callback])
    const [upLoader, setUpLoader] = useState<Loader>(INITIAL_LOADER)
    const [downLoader, setDownLoader] = useState<Loader>(INITIAL_LOADER)

    const [intersector, setIntersector] = useState<IntersectionObserver>(undefined!)
    useEffect(() => {
        setIntersector(intersector => {
            intersector?.disconnect()
            return new IntersectionObserver(
                () => {
                    if (block)
                        return
                    if (watch !== "DOWN")
                        setUpLoader(prevState => (prevState.loading ? prevState : {...prevState, fetch: true}))
                    if (watch !== "UP")
                        setDownLoader(prevState => (prevState.loading ? prevState : {...prevState, fetch: true}))
                }, {
                    threshold: 0,
                }
            )
        })
    }, [block, watch])

    const loaderRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const ele = loaderRef?.current
        if(ele){
            intersector?.observe(ele)
            return () => intersector?.unobserve(ele)
        }
    }, [loaderRef?.current, intersector])

    useEffect(() => () => setIntersector(intersector => {intersector.disconnect(); return undefined!}), [])// Turn off intersector on unload

    const initialLoad = useCallback(() => {
        switch (watch) {
            case "UP":
                setUpLoader(prevState => ({...prevState, loading: true}))
                upCallback(0).then(over => {
                    setUpLoader({
                        over,
                        fetch: false,
                        count: 1,
                        loading: false
                    })
                })
                break
            case "DOWN":
                setDownLoader(prevState => ({...prevState, loading: true}))
                downCallback(0).then(over => {
                    setDownLoader({
                        over,
                        fetch: false,
                        count: 1,
                        loading: false
                    })
                })
                break
        }
    }, [downCallback, upCallback, watch])

    useImperativeHandle(ref, () => ({
        resetData() {
            initialLoad()
        }
    }))

    useEffect(() => {
        if (!upLoader.over && !upLoader.loading && upLoader.fetch) {
            setUpLoader(prevState => ({...prevState, loading: true}))
            const f = Array.isArray(callback) ? callback[0] : callback
            f(upLoader.count).then(over => {
                setUpLoader(prevState => ({
                    over,
                    fetch: false,
                    count: ++prevState.count,
                    loading: false
                }))

                if((loaderRef?.current?.getBoundingClientRect().top ?? 0) > 0 && !block)
                    setUpLoader(prevState => ({...prevState, fetch: true}))
            })
        }
    }, [upLoader, callback, loaderRef?.current, block])

    useEffect(() => {
        if (!downLoader.over && !downLoader.loading && downLoader.fetch) {
            setDownLoader(prevState => ({...prevState, loading: true}))
            const f = Array.isArray(callback) ? callback[1] : callback
            f(downLoader.count).then(over => {
                setDownLoader(prevState => ({
                    over,
                    fetch: false,
                    count: ++prevState.count,
                    loading: false
                }))
                if((loaderRef?.current?.getBoundingClientRect().top ?? Number.MAX_VALUE) < window.innerHeight && !block)
                    setDownLoader(prevState => ({...prevState, fetch: true}))
            })
        }
    }, [downLoader, callback, loaderRef?.current, block])

    return (
        <div className="relative h-auto">
            {(watch !== "DOWN") && !empty && (
                <div className="mb-3 text-center">
                    { upLoader.over ?
                        <p>{t("end")}</p> :
                        upLoader.loading && (loadingComponent || <Loading size="3x"/>)}
                </div>
            )}

            <div className={className}>
                {children}
            </div>

            <div className="invisible absolute" style={{marginTop: `-${triggerDistance}px`}} ref={loaderRef} />

            {(watch !== "UP") && !empty && (
                <div className="mb-3 text-center">
                    { downLoader.over ?
                        <p>{t("end")}</p>:
                        (loadingComponent || <Loading size="3x"/>)
                    }
                </div>
            )}
        </div>
    )

})
InfiniteScroller.displayName = "InfiniteScroller"
InfiniteScroller.defaultProps = {
    className: ""
}
export default InfiniteScroller