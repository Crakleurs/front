import React, { useCallback, useContext, useEffect, useState } from "react"
import { AppContext } from "../../context/app/context"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { notificationManager } from "../../datamanager/NotificationManager"
import { Notification as NotificationType } from "../../data/notification/types"
import Notification from "."
import { setNotificationsWatched } from "../../data/notification"

const NotificationsOverlay: React.FC = () => {
    const { t } = useTranslation("notifications")

    const minNotificationId = useLiveQuery(async () => await notificationManager.getMaxLoaded(), [])

    const notifications = useLiveQuery(async () => {
        if(minNotificationId != undefined && minNotificationId != Number.MAX_SAFE_INTEGER)
            return (await notificationManager.getNotifications(minNotificationId)).filter(notif => !notif.watched)
    }, [minNotificationId])

    useEffect(() => console.log("[Notification] Recieved:", notifications?.filter(notif => !notif.watched)), [notifications])

    const clickNotifFactory = useCallback((notif: NotificationType) => {
        return () => {
            setNotificationsWatched([notif]).then(res => res.data).then(unwatchedCount => {
                notificationManager.setUnwatched(unwatchedCount)
                notificationManager.watch([notif])
            }).catch(e => console.error(e))
        }
    }, [])

    return <div className="fixed bottom-3 left-3 flex flex-col gap-3 w-80">
        { notifications?.map(notif => 
            <div onClick={clickNotifFactory(notif)}>
                <Notification {...notif} key={notif.id} backgroundHover={false} className={"bg-white shadow-sm hover:bg-[#fcfcfc] hover:shadow-md transition-all"} />
            </div>
        ) }
    </div>

}
export default NotificationsOverlay