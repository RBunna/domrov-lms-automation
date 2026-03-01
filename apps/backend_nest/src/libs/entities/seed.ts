import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import path from 'path';

// ==========================================
// 1. IMPORT YOUR ENTITIES HERE
// ==========================================
import { User } from './user/user.entity';
import { Class } from './classroom/class.entity';
import { Enrollment } from './classroom/enrollment.entity';
import { Team } from './classroom/team.entity';
import { TeamMember } from './classroom/user-team.entity';
import { Resource } from './resource/resource.entity';
import { Assessment } from './assessment/assessment.entity';
import { Rubrics } from './assessment/rubic.entity';
import { Submission } from './assessment/submission.entity';
import { Payment } from './ai/payment.entity';
import { AIUsageLog } from './ai/ai-usage-log.entity';
import { Currency, PaymentMethod } from '../enums/Payment';
import { PaymentStatus, SubmissionStatus, UserStatus } from '../enums/Status';
import { SystemRole, UserRole } from '../enums/Role';
import { SubmissionType, SubmissionMethod } from '../enums/Assessment';
import { SubmissionResource } from './resource/submission-resource.entity';
import { Encryption } from '../utils/Encryption';
// import { EvaluationRubricScore } from './assessment/evaluation-rubric-score.entity';
import { ResourceType } from '../enums/Resource';
import AppDataSource from '../../database/data-source';
import { CreditPackage } from './ai/credit-package.entity';
import { UserCreditBalance } from './ai/user-credit-balance.entity';


export async function seed() {
    await AppDataSource.initialize();
    console.log('🌱 DataSource initialized. Starting seeding...');
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // -----------------------
        // 1. CLEAR DATABASE
        // -----------------------
        console.log('🧹 Clearing existing data...');
        await queryRunner.query(`
            DO
            $$
            DECLARE
                tbl RECORD;
            BEGIN
                FOR tbl IN
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = current_schema()
                LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(tbl.tablename) || ' RESTART IDENTITY CASCADE;';
                END LOOP;
            END
            $$;
        `);

        // -----------------------
        // 2. SEED USERS
        // -----------------------
        console.log('👤 Seeding Users...');
        const khmerFirstNames = ['Sophea', 'Vannak', 'Sokha', 'Chanda', 'Ratha', 'Sreymom', 'Borey', 'Sophal', 'Rithy', 'Sokunthea'];
        const khmerLastNames = ['Heng', 'Chhun', 'Meas', 'Ngin', 'Keo', 'Sok', 'Rith', 'Ouk', 'Touch', 'Ly'];
        const users: User[] = [];

        const userHashes = await Promise.all(
            Array.from({ length: 15 }).map(() => Encryption.hashPassword('password123'))
        );

        for (let i = 0; i < 15; i++) {
            const user = new User();
            const firstName = khmerFirstNames[i % khmerFirstNames.length];
            const lastName = khmerLastNames[i % khmerLastNames.length];

            user.firstName = firstName;
            user.lastName = lastName;
            user.gender = i % 2 === 0 ? 'male' : 'female';
            user.dob = new Date(1985 + (i % 20), (i % 12), (i % 28) + 1);
            user.phoneNumber = `0123456${(100 + i).toString().slice(-4)}`;
            user.status = UserStatus.ACTIVE;
            user.isVerified = true;
            user.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
            user.password = userHashes[i];

            users.push(await queryRunner.manager.save(user));
            console.log(`✅ User created: ${user.firstName} ${user.lastName}`);
        }

        // Fixed Super Admin
        const superAdmin = new User();
        superAdmin.email = 'cpf.cadt@gmail.com';
        superAdmin.password = await Encryption.hashPassword('Admin@123');
        superAdmin.firstName = 'Super';
        superAdmin.lastName = 'Admin';
        superAdmin.status = UserStatus.ACTIVE;
        superAdmin.role = SystemRole.SuperAdmin;
        superAdmin.isVerified = true;
        await queryRunner.manager.save(superAdmin);
        console.log('✅ Super Admin created');

        // -----------------------
        // 3. SEED CREDIT PACKAGES
        // -----------------------
        console.log('💰 Seeding Credit Packages...');
        const creditPackages: CreditPackage[] = [];
        for (let i = 0; i < 3; i++) {
            const pkg = new CreditPackage();
            pkg.name = `Pack ${i + 1}`;
            pkg.description = faker.lorem.sentence();
            pkg.credits = faker.number.int({ min: 1000, max: 10000 });
            pkg.price = faker.number.float({ min: 5, max: 50, fractionDigits: 2 });
            pkg.currency = Currency.USD;
            pkg.bonusCredits = faker.number.int({ min: 0, max: 500 });
            pkg.isActive = true;
            pkg.sortOrder = i + 1;
            creditPackages.push(await queryRunner.manager.save(pkg));
        }

        // Assign wallet to all users
        for (const user of users) {
            const wallet = new UserCreditBalance();
            wallet.user = user;
            wallet.creditBalance = faker.number.int({ min: 500, max: 5000 });
            await queryRunner.manager.save(wallet);
        }

        // -----------------------
        // 4. SEED CLASSES & TEAMS
        // -----------------------
        console.log('🏫 Seeding Classes & Teams...');
        const teacher = users[0];
        const studentUsers = users.slice(1);

        const myClass = new Class();
        myClass.name = `Advanced SE ${faker.number.int({ min: 100, max: 999 })}`;
        myClass.joinCode = faker.string.alphanumeric(6).toUpperCase();
        myClass.owner = teacher;
        await queryRunner.manager.save(myClass);

        for (const student of studentUsers) {
            const enrollment = new Enrollment();
            enrollment.user = student;
            enrollment.class = myClass;
            enrollment.role = UserRole.Student;
            await queryRunner.manager.save(enrollment);
        }

        // Teams
        for (let i = 0; i < 3; i++) {
            const team = new Team();
            team.name = `Team ${faker.animal.type()}`;
            team.joinCode = faker.string.alphanumeric(6).toUpperCase();
            team.maxMember = 4;
            team.class = myClass;
            team.leader = studentUsers[i];
            const savedTeam = await queryRunner.manager.save(team);

            for (let j = 0; j < 3; j++) {
                const memberIndex = (i + j + 1) % studentUsers.length;
                const member = new TeamMember();
                member.team = savedTeam;
                member.user = studentUsers[memberIndex];
                member.isApproved = true;
                await queryRunner.manager.save(member);
            }
        }

        // -----------------------
        // 5. SEED ASSESSMENTS
        // -----------------------
        console.log('📝 Seeding Assessments...');
        const assessment = new Assessment();
        assessment.title = 'Library Management System - Week 2';
        assessment.instruction = 'Implement a library system using C++ structs and pointers.';
        assessment.startDate = new Date();
        assessment.dueDate = faker.date.future();
        assessment.maxScore = 100;
        assessment.submissionType = SubmissionType.INDIVIDUAL;
        assessment.class = myClass;
        assessment.aiEvaluationEnable = true;
        assessment.allowedSubmissionMethod = SubmissionMethod.GITHUB;

        const savedAssessment = await queryRunner.manager.save(assessment);

        // Rubrics
        const rubricCriteria = [
            { text: "Define Book struct in models/Book.h", score: 15 },
            { text: "Implement addBook and displayAllBooks", score: 15 },
            { text: "Implement findBookById returning a pointer (Book*)", score: 25 },
            { text: "Implement checkOutBook and returnBook", score: 10 },
            { text: "Implement showPromotionalBooks in main.cpp", score: 10 },
            { text: "Implement Sorting and Searching (Bubble/Binary)", score: 25 }
        ];

        for (const item of rubricCriteria) {
            const rubric = new Rubrics();
            rubric.definition = item.text;
            rubric.totalScore = item.score;
            rubric.assessment = savedAssessment;
            await queryRunner.manager.save(rubric);
        }

        // -----------------------
        // 6. SEED SUBMISSIONS
        // -----------------------
        console.log('📊 Seeding Submissions...');
        const githubUrls = [
            "https://github.com/Next-Gen-G9/week-2-algorithms-anisda.git",
            "https://github.com/Next-Gen-G9/week-2-algorithms-chill-chill.git",
            "https://github.com/Next-Gen-G9/week-2-algorithms-dy-jin.git",
            "https://github.com/Next-Gen-G9/week-2-algorithms-gossip-team.git"
        ];

        for (let i = 0; i < githubUrls.length; i++) {
            const studentUser = studentUsers[i];
            if (!studentUser) break;

            const submission = new Submission();
            submission.assessment = savedAssessment;
            submission.user = studentUser;
            submission.status = SubmissionStatus.PENDING;
            const savedSubmission = await queryRunner.manager.save(submission);

            const resource = new Resource();
            resource.title = `Project Repo: ${studentUser.lastName}`;
            resource.type = ResourceType.URL;
            resource.url = githubUrls[i];
            resource.owner = `Student:${studentUser.id}`;
            await queryRunner.manager.save(resource);

            const submissionResource = new SubmissionResource();
            submissionResource.submission = savedSubmission;
            submissionResource.resource = resource;
            await queryRunner.manager.save(submissionResource);
        }

        // -----------------------
        // 7. SEED USAGE LOGS & PAYMENTS
        // -----------------------
        console.log('📊 Seeding Usage & Payments...');
        for (const user of users) {
            const log = new AIUsageLog();
            log.title = 'Code Analysis';
            log.usingDate = new Date();
            log.inputTokenCount = faker.number.int({ min: 100, max: 1000 });
            log.outputTokenCount = faker.number.int({ min: 50, max: 500 });
            log.user = user;
            await queryRunner.manager.save(log);

            const payment = new Payment();
            payment.paymentMethod = faker.helpers.enumValue(PaymentMethod);
            payment.amount = faker.number.float({ min: 5, max: 20, fractionDigits: 2 });
            payment.currency = Currency.USD;
            payment.status = PaymentStatus.COMPLETED;
            payment.user = user;
            payment.creditPackage = faker.helpers.arrayElement(creditPackages);
            await queryRunner.manager.save(payment);
        }

        await queryRunner.commitTransaction();
        console.log('✅ Seeding completed successfully!');
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
        await AppDataSource.destroy();
    }
}
seed();