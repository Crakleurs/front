import React, {useCallback, useEffect, useRef, useState} from "react"
import StudentSelector from "../../Student/StudentSelector"
import {useTranslation} from "react-i18next"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus } from "@fortawesome/free-solid-svg-icons"

type AddMemberProps = {
    onAdd: (id: number) => void
}
const AddMember: React.FC<AddMemberProps> = ({onAdd}) => {
    const {t} = useTranslation("group")

    const onSelect = useCallback((ids: number[])=> ids.forEach(onAdd), [onAdd])

    const [selected, setSelected] = useState(false)

    const selectorRef = useRef<HTMLDivElement>(null)

    const input = selectorRef.current?.querySelector("input")

    useEffect(() => {
        if(input && selected){
            input.focus()

            const fnc = (event: MouseEvent) => setSelected(false)
            window.addEventListener("click", fnc)
            return () => window.removeEventListener("click", fnc)
        }else if(input)
            input.blur()
    }, [input, selected])
    return (
        <div className="flex justify-center mr-2">
            <div ref={selectorRef} onClick={()=>setSelected(true)} className={"flex items-center mx-auto rounded-full bg-indigo-400 text-base text-white cursor-pointer opacity-100 hover:opacity-80 duration-200 " + (selected ? "w-full py-1 px-2.5 rounded-lg h-10" : "w-8 h-8 px-2 py-2")}>
                <FontAwesomeIcon
                    icon={faPlus}
                    className="w-4 h-4 block flex-shrink-0"
                ></FontAwesomeIcon>
                <StudentSelector onChange={onSelect} className="w-full ml-2 opacity-40 rounded-lg overflow-hidden" placeholder={t("add_member")} />
            </div>
        </div>
    )
}

export default AddMember