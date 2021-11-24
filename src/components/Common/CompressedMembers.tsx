import React from "react"
import { StudentPreview } from "../../data/student/types"
import StudentAvatar from "../Student/StudentAvatar"
import { AvatarSizes } from "../../constants/MediaSizes"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"

type CompressedMembersProps = {
    members: StudentPreview[]
    className?: string
}
const CompressedMembers: React.FC<CompressedMembersProps> = ({ members, className }) => {
    return <div className={"flex " + className}> {
        members.slice(0, 9).map((student, index, array) =>
            <div className="-mr-1.5 relative" style={{ zIndex: 100 - index }} key={index}>
                {array.length - 1 == index && array.length != members.length && <div className="rounded-full bg-black bg-opacity-50 absolute w-full h-full z-10 text-gray-300 items-center justify-center flex text-xs border-gray-100 border-2">
                    <div className="transform scale-50 flex">
                        <FontAwesomeIcon icon={faCircle} size="xs" className="mr-0.5"></FontAwesomeIcon>
                        <FontAwesomeIcon icon={faCircle} size="xs" className="mr-0.5"></FontAwesomeIcon>
                        <FontAwesomeIcon icon={faCircle} size="xs"></FontAwesomeIcon>
                    </div>
                </div>}
                <StudentAvatar
                    id={student.id}
                    name=""
                    picture={student.picture}
                    pictureSize={AvatarSizes.THUMBNAIL}
                    className="border-gray-100 border-2 rounded-full"
                    size="small"
                />
            </div>
        )
    } </div>
}

export default CompressedMembers