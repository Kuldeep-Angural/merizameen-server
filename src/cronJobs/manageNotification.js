import user from "../model/user.js";
import { emailService } from "../service/email/emailService.js";
import { planExpireTemplate } from '../template/planExpireTemplate.js';
import { daysUntil } from "../util/util.js";

export const manageNotification = async () => {
    const sendPlanExpireMail = async ({ email, dayLeft }) => {
        try {
            await emailService({
                to: email,
                subject: "Friendly Reminder: Membership Expiration",
                html: planExpireTemplate(dayLeft),
                text: "",
            });
        } catch (error) {
            console.error(`Failed to send email to ${email}:`, error);
        }
    };

    try {
        const allUsers = await user.find();
        const emailPromises = allUsers.map(async (u) => {
            const dayLeft = daysUntil(u?.memberShip?.endDate);
            if (dayLeft <= 3) {
                await sendPlanExpireMail({ email: u.email, dayLeft });
            }
        });
        await Promise.all(emailPromises);
    } catch (error) {
        console.error('Error fetching users or sending emails:', error);
    }
};
