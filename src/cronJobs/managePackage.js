

import property from '../model/post.js';
import user from '../model/user.js';
import { checkIsTodayDate } from '../util/util.js';

const managePackage = async () => {
    const InactiveProperties = async (userId, limit , ) => {
        const properties = await property.find({ userId });
        const propertiesToUpdate = properties.slice(0, properties.length - limit);
        const updatePromises = propertiesToUpdate.map((prop) =>
            property.findByIdAndUpdate(prop._id, { isActive: false })
        );
        await Promise.all(updatePromises);
    };

    const ActiveProperties = async (userId, limit) => {
        const properties = await property.find({ userId });
        const propertiesToUpdate = properties.slice(0, properties.length - limit);
        const updatePromises = propertiesToUpdate.map((prop) =>
            property.findByIdAndUpdate(prop._id, { isActive: true })
        );
        await Promise.all(updatePromises);
    };

    try {
        const allUsers = await user.find();

        if (allUsers) {

            const updateUserMembership = async (userId) => {
                await user.findByIdAndUpdate(userId, {
                    memberShip: {
                        type: 'Standard Access',
                    },
                });
            };

            const userUpdatePromises = allUsers.map(async (u) => {
                const properties = await property.find({ userId:u._id });
                await user.findByIdAndUpdate(u._id,{
                    usage:{
                        posts:properties?.length
                    }
                })

                if (u.memberShip.type === 'Standard Access' && u.usage.posts >= 2) {
                    await InactiveProperties(u._id, 2);
                } else if (u.memberShip.type === 'Premium Access' && checkIsTodayDate(u?.memberShip?.endDate)) {
                    await InactiveProperties(u._id, 10);
                    await updateUserMembership(u._id);
                }else if(u.memberShip.type === 'Premium Access' && !checkIsTodayDate(u?.memberShip?.endDate)){
                    console.log("inside premium", );
                    await ActiveProperties(u._id, 0);
                }
            });

           const updated=  await Promise.all(userUpdatePromises);
        }
    } catch (error) {
        console.error('Error managing packages:', error);
    }
};


export default managePackage;