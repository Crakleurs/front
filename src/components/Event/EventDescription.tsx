import React, {useRef, useState} from "react"
import {DownOutlined, UpOutlined} from "@ant-design/icons"
import {useTranslation} from "react-i18next"


type EventDescriptionProps = {
    description: string
}
const EventDescription: React.FC<EventDescriptionProps> = ({description}) => {
    const {t} = useTranslation("event")
    const descriptionRef = useRef<HTMLInputElement>(null)
    const [descVisible, setDescVisible] = useState<boolean>(false)

    return (
        <div
            className="flex flex-col justify-center mt-5 text-xs text-gray-600 cursor-pointer"
            onClick={() => {
                if (descriptionRef.current) {
                    setDescVisible(descriptionRef.current?.classList.toggle("h-0"))
                }
            }}
        >
            <h3 className=" font-dinotcb text-center text-lg text-gray-700">
                {t("form.label.description")}
            </h3>
            <div ref={descriptionRef} className="overflow-hidden max-w-4xl">
                {description && description.split("\n").map((s, idx) =>
                    <span key={idx}>{s} <br/></span>
                )}
            </div>
            {descVisible ? <DownOutlined className="mx-auto"/> : <UpOutlined className="mx-auto"/>}
        </div>
    )
}

export default EventDescription