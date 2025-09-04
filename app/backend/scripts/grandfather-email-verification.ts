/**
 * Migration script to grandfather existing users with email verification
 * Run this script once after adding email verification fields
 */

import { PrismaClient } from '../src/db/generated/client';

const prisma = new PrismaClient();

async function grandfatherExistingUsers() {
    try {
        console.log('Starting to grandfather existing users...');

        // Update all existing users with emails to be verified
        const result = await prisma.user.updateMany({
            where: {
                email: {
                    not: null
                },
                emailVerified: {
                    not: true // Only update users who aren't already verified
                }
            },
            data: {
                emailVerified: true
            }
        });

        console.log(`Updated ${result.count} existing users to emailVerified = true`);

        // Log some stats
        const totalUsersWithEmail = await prisma.user.count({
            where: {
                email: {
                    not: null
                }
            }
        });

        const verifiedUsers = await prisma.user.count({
            where: {
                emailVerified: true
            }
        });

        console.log(`Total users with email: ${totalUsersWithEmail}`);
        console.log(`Total verified users: ${verifiedUsers}`);

    } catch (error) {
        console.error('Error grandfathering existing users:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
grandfatherExistingUsers()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
