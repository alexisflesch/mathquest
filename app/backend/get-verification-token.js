const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getVerificationToken() {
    try {
        // Find a user with a verification token
        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: {
                    not: null
                },
                emailVerified: false
            },
            select: {
                id: true,
                email: true,
                emailVerificationToken: true,
                emailVerified: true
            }
        });

        if (user) {
            console.log('Found unverified user:');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Email Verified:', user.emailVerified);
            console.log('Verification Token:', user.emailVerificationToken);
        } else {
            console.log('No unverified users with verification tokens found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getVerificationToken();
