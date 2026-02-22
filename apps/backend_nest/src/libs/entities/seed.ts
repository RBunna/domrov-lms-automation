import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import path from 'path';

// ==========================================
// 1. IMPORT YOUR ENTITIES HERE
// ==========================================
import { User } from './user/user.entity';
import { PlatformAIModel } from './ai/platform-ai-model.entity';
import { Class } from './classroom/class.entity';
import { Enrollment } from './classroom/enrollment.entity';
import { Team } from './classroom/team.entity';
import { TeamMember } from './classroom/user-team.entity';
import { Resource } from './resource/resource.entity';
import { Assessment } from './assessment/assessment.entity';
import { Rubrics } from './assessment/rubic.entity';
import { Submission } from './assessment/submission.entity';
import { Evaluation } from './assessment/evaluation.entity';
import { Payment } from './ai/payment.entity';
import { AIUsageLog } from './ai/ai-usage-log.entity';
import { Currency, PaymentMethod } from '../enums/Payment';
import { PaymentStatus, SubmissionStatus, UserStatus } from '../enums/Status';
import { UserRole } from '../enums/Role';
import { EvaluationType, SubmissionType, SubmissionMethod } from '../enums/Assessment';
import { OAuthAccount } from './user/oauth-account.entity';
import { OAuthProvider } from './user/oauth-provider.entity';
import { TelegramChat } from './user/telegram-chat.entity';
import { UserEmailOtp } from './user/user-email-otp.entity';
import { UserRefreshToken } from './user/user-refresh-token.entity';
import { AssessmentResource } from './resource/assessment-resource.entity';
import { SubmissionResource } from './resource/submission-resource.entity';
import { Encryption } from '../utils/Encryption';
import { EvaluationFeedback } from './assessment/evaluation-feedback.entity';
// import { EvaluationRubricScore } from './assessment/evaluation-rubric-score.entity';
import { ResourceType } from '../enums/Resource';
import AppDataSource from '../../database/data-source';
import { CreditPackage } from './ai/credit-package.entity';
import { UserCreditBalance } from './ai/user-credit-balance.entity';


async function seed() {
    await AppDataSource.initialize();
    console.log('🌱 DataSource initialized. Starting seeding...');
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    // ==========================================
    // 4. TRUNCATE DATA
    // ==========================================
    console.log('🧹 Clearing existing data...');
    // Updated to match your entities
    await queryRunner.query(`
        DO
        $$
        DECLARE
            tbl RECORD;
        BEGIN
            -- Loop over all tables in the current schema
            FOR tbl IN
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = current_schema()
            LOOP
                -- Execute truncate with cascade and restart identity
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(tbl.tablename) || ' RESTART IDENTITY CASCADE;';
            END LOOP;
        END
        $$;
    `);

    try {
        // --- 1. SEED USERS ---
        console.log('👤 Seeding Users...');
        const users: User[] = [];

        for (let i = 0; i < 15; i++) {
            const user = new User();

            // 1. Generate names first
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();

            user.firstName = firstName;
            user.lastName = lastName;
            user.gender = faker.person.sexType();
            user.dob = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
            user.phoneNumber = faker.string.numeric(10);
            user.status = UserStatus.ACTIVE;
            user.isVerified = true;

            // 2. Create the email MANUALLY using the names
            // We lowercase them and remove spaces/special characters to ensure a valid email format
            const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
            user.email = `${cleanFirstName}.${cleanLastName}@example.com`;

            user.password = await Encryption.hashPassword('password123');

            users.push(await queryRunner.manager.save(user));
        }

        // --- 2. SEED AI MODELS ---
        console.log('🤖 Seeding AI Models...');
        const models: PlatformAIModel[] = [];
        const modelNames = ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini 1.5 Pro'];
        for (const name of modelNames) {
            const model = new PlatformAIModel();
            model.name = name;
            model.apiUrl = faker.internet.url();
            model.accuracy = faker.number.float({ min: 0.8, max: 0.99, fractionDigits: 2 });
            model.costPerInputToken = faker.number.float({ min: 0.0001, max: 0.001, fractionDigits: 5 });
            model.costPerOutputToken = faker.number.float({ min: 0.0002, max: 0.002, fractionDigits: 5 });
            models.push(await queryRunner.manager.save(model));
        }

        // --- 3. SEED WALLETS & CREDIT PACKAGES ---
        console.log('💰 Seeding Wallets & Credit Packages...');
        const creditPackages: CreditPackage[] = [];
        for (let i = 0; i < 3; i++) {
            const pkg = new CreditPackage();
            pkg.name = `${faker.commerce.productName()} Pack`;
            pkg.description = faker.lorem.sentence();
            pkg.credits = faker.number.int({ min: 1000, max: 10000 });
            pkg.price = faker.number.float({ min: 5, max: 50, fractionDigits: 2 });
            pkg.currency = Currency.USD;
            pkg.bonusCredits = faker.number.int({ min: 0, max: 500 });
            pkg.isActive = true;
            pkg.sortOrder = i + 1;
            creditPackages.push(await queryRunner.manager.save(pkg));
        }

        for (const user of users) {
            const wallet = new UserCreditBalance();
            wallet.user = user;
            wallet.creditBalance = faker.number.int({ min: 500, max: 5000 });
            await queryRunner.manager.save(wallet);
        }

        // --- 4. SEED CLASSES, ENROLLMENTS & TEAMS ---
        console.log('🏫 Seeding Classes & Teams...');
        const teacher = users[0];
        const studentUsers = users.slice(1);

        const myClass = new Class();
        myClass.name = `Advanced Software Engineering ${faker.number.int({ min: 100, max: 999 })}`;
        myClass.joinCode = faker.string.alphanumeric(6).toUpperCase();
        myClass.owner = teacher;
        await queryRunner.manager.save(myClass);

        // Enroll students
        for (const student of studentUsers) {
            const enrollment = new Enrollment();
            enrollment.user = student;
            enrollment.class = myClass;
            enrollment.role = UserRole.Student;
            await queryRunner.manager.save(enrollment);
        }

        // Create Teams
        for (let i = 0; i < 3; i++) {
            const team = new Team();
            team.name = `Team ${faker.animal.type()}`;
            team.joinCode = faker.string.alphanumeric(6).toUpperCase();
            team.maxMember = 4;
            team.class = myClass;
            team.leader = studentUsers[i];
            const savedTeam = await queryRunner.manager.save(team);

            // Add members
            for (let j = 0; j < 3; j++) {
                const member = new TeamMember();
                member.team = savedTeam;
                member.user = studentUsers[i + j + 1];
                member.isApproved = true;
                await queryRunner.manager.save(member);
            }
        }

        // --- 5. SEED ASSESSMENTS ---
        console.log('📝 Seeding Assessments...');
        const assessment = new Assessment();
        assessment.title = 'Library Management System - Week 2';
        assessment.instruction = 'Implement a library system using C++ structs and pointers.';
        assessment.startDate = new Date();
        assessment.dueDate = faker.date.future();
        assessment.maxScore = 100;
        assessment.submissionType = SubmissionType.INDIVIDUAL;
        assessment.class = myClass;
        assessment.aiModel = models[0];
        assessment.aiEvaluationEnable = true;
        assessment.allowedSubmissionMethod = SubmissionMethod.GITHUB;

        const savedAssessment = await queryRunner.manager.save(assessment);

        // Specific Rubrics based on your requirement (Total: 100)
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

        // --- 6. SEED SUBMISSIONS (Excluding Teacher) ---
        console.log('📊 Seeding Submissions for Students...');

        const githubUrls = [
            "https://github.com/Next-Gen-G9/week-2-algorithms-anisda.git",
            "https://github.com/Next-Gen-G9/week-2-algorithms-chill-chill.git",
            "https://github.com/Next-Gen-G9/week-2-algorithms-dy-jin.git",
            "https://github.com/Next-Gen-G9/week-2-algorithms-gossip-team.git"
        ];

        for (let i = 0; i < githubUrls.length; i++) {
            // 👈 LOGIC: Offset by 1 to skip the Teacher (users[0])
            // Student 1 gets users[1], Student 2 gets users[2], etc.
            const studentUser = users[i + 1];

            if (!studentUser) break;

            const submission = new Submission();
            submission.assessment = savedAssessment;
            submission.user = studentUser;
            submission.status = SubmissionStatus.PENDING; // Ready to test
            const savedSubmission = await queryRunner.manager.save(submission);

            // Create the Resource as a GitHub LINK
            const resource = new Resource();
            resource.title = `Project Repo: ${studentUser.lastName}`;
            resource.type = ResourceType.URL;
            resource.url = githubUrls[i];
            resource.owner = `Student:${studentUser.id}`;
            const savedResource = await queryRunner.manager.save(resource);

            // Link Resource to Submission via Junction Table
            const submissionResource = new SubmissionResource();
            submissionResource.submission = savedSubmission;
            submissionResource.resource = savedResource;
            await queryRunner.manager.save(submissionResource);
        }

        // --- 7. SEED USAGE LOGS & PAYMENTS ---
        console.log('📊 Seeding Usage & Payments...');
        for (const user of users) {
            // Usage
            const log = new AIUsageLog();
            log.title = 'Code Analysis';
            log.usingDate = new Date();
            log.inputTokenCount = faker.number.int({ min: 100, max: 1000 });
            log.outputTokenCount = faker.number.int({ min: 50, max: 500 });
            log.user = user;
            log.model = faker.helpers.arrayElement(models);
            await queryRunner.manager.save(log);

            // Payment
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