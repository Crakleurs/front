import React, {useMemo, useState} from "react"
import {Button, Modal} from "antd"
import {useTranslation} from "react-i18next"
import {Event, EventForm as EventFormType} from "../../data/event/types"
import EventEditForm from "./Form/EventEditForm"
import {faEdit, faPencilAlt} from "@fortawesome/free-solid-svg-icons"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"


type EventEditorModalProps = {
    values: Event
    onSubmit?: (e: Event) => void
}
const EventEditorModal: React.FC<EventEditorModalProps> = ({values, onSubmit}) => {
    const {t} = useTranslation("event")
    const [open, setOpen] = useState<boolean>(false)
    const eventForm: EventFormType = useMemo(() => ({
        type: values.type,
        title: values.title,
        description: values.description,
        closed: values.closed,
        startsAt: values.startsAt,
        endsAt: values.endsAt,
        club: values.club.id,
        published: values.published,
        targets: values.targets.map(t => t.id),
    }), [values])

    return (
        <>
            <button
                className="w-full h-full grid place-items-center"
                style={{width: "max-content"}}
                onClick={() => setOpen(true)}
            >
                <FontAwesomeIcon
                    className="cursor-pointer text-white text-opacity-90 mx-1 group-hover:text-opacity-100 transition-colors"
                    icon={faPencilAlt}
                />
            </button>
            {open && (
                <Modal
                    className="md:w-2/3 w-4/5"
                    visible={true}
                    footer={null}
                    title={<span className="text-gray-800 font-bold text-2xl">{t("edit.title")}</span>}
                    onCancel={() => setOpen(false)}
                >
                    <EventEditForm onSubmit={onSubmit} onClose={() => setOpen(false)} event={eventForm} message={t("edit.edited")}/>
                </Modal>
            )}
        </>
    )
}
export default EventEditorModal
