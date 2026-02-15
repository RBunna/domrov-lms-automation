import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import path from 'path';

// ==========================================
// 1. IMPORT YOUR ENTITIES HERE
// ==========================================
import { User } from './user/user.entity';
import { UserTokenBalance } from './ai/user-token-balance.entity';
import { TokenPackage } from './ai/token-package.entity';
import { PlatformAIModel } from './ai/platform-ai-model.entity';
import { WalletTransaction } from './ai/wallet-transaction.entity';
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
import { ClassResource } from './resource/class-resource.entity';
import { ModuleResource } from './resource/module-resource.entity';
import { SubmissionResource } from './resource/submission-resource.entity';
import { TopicResource } from './resource/topic-resource.entity';
import { Encryption } from '../utils/Encryption';
import { Module as LessonModule } from '../../libs/entities/lesson/module.entity';
import { EvaluationFeedback } from './assessment/evaluation-feedback.entity';
// import { EvaluationRubricScore } from './assessment/evaluation-rubric-score.entity';
import { Topic } from './lesson/topic.entity';
import { ResourceType } from '../enums/Resource';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// ==========================================
// 3. DATABASE CONFIGURATION
// ==========================================
const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [
        User,
        OAuthAccount,
        OAuthProvider,
        TelegramChat,
        UserEmailOtp,
        UserRefreshToken,
        Class,
        Enrollment,
        Team,
        TeamMember,
        Assessment,
        Submission,
        Evaluation,
        Rubrics,
        LessonModule,
        Topic,
        Resource,
        AssessmentResource,
        ClassResource,
        ModuleResource,
        SubmissionResource,
        TopicResource,
        AIUsageLog,
        Payment,
        PlatformAIModel,
        TokenPackage,
        UserTokenBalance,
        WalletTransaction,
        EvaluationFeedback,
    ],
    synchronize: true, // Set to false in production
    logging: false,
});

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
        TRUNCATE TABLE 
            "submission_resources", "topic_resources", "module_resources", 
            "class_resources", "assessment_resources", "resources",
            "evaluation_feedback", "evaluations",
            "submissions", "rubrics", "assessments",
            "team_members", "teams", "enrollments", "classes",
            "wallet_transactions", "user_token_balances", "payments",
            "token_packages", "ai_usage_logs", "platform_ai_models",
            "telegram_chats", "oauth_accounts", "oauth_providers",
            "user_email_otp", "user_refresh_token", "users"
        RESTART IDENTITY CASCADE;
    `);

    try {
        // --- 1. SEED USERS ---
        console.log('👤 Seeding Users...');
        const users: User[] = [];
        for (let i = 0; i < 15; i++) {
            const user = new User();
            user.firstName = faker.person.firstName();
            user.lastName = faker.person.lastName();
            user.gender = faker.person.sexType();
            user.dob = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
            user.phoneNumber = faker.string.numeric(10);
            user.status = UserStatus.ACTIVE;
            user.isVerified = true;
            user.email = faker.internet.email();
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

        // --- 3. SEED WALLETS & PACKAGES ---
        console.log('💰 Seeding Wallets & Packages...');
        const tokenPackages: TokenPackage[] = [];
        for (let i = 0; i < 3; i++) {
            const pkg = new TokenPackage();
            pkg.name = `${faker.commerce.productName()} Pack`;
            pkg.tokenAmount = faker.number.int({ min: 1000, max: 10000 });
            pkg.price = faker.number.float({ min: 5, max: 50, fractionDigits: 2 });
            tokenPackages.push(await queryRunner.manager.save(pkg));
        }

        for (const user of users) {
            const wallet = new UserTokenBalance();
            wallet.user = user;
            wallet.tokenBalance = faker.number.int({ min: 500, max: 5000 });
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
        assessment.title = 'Final Project Proposal';
        assessment.instruction = faker.lorem.paragraph();
        assessment.startDate = new Date();
        assessment.dueDate = faker.date.future();
        assessment.maxScore = 100;
        assessment.submissionType = SubmissionType.INDIVIDUAL;
        assessment.class = myClass;
        assessment.aiModel = models[0];
        assessment.aiEvaluationEnable = true;
        assessment.allowTeamSubmition = true;
        assessment.allowedSubmissionMethod = SubmissionMethod.ANY; // 👈 Updated
        const savedAssessment = await queryRunner.manager.save(assessment);

        // Add Rubrics
        for (let i = 0; i < 3; i++) {
            const rubric = new Rubrics();
            rubric.definition = faker.lorem.sentence();
            rubric.totalScore = 100 / 3;
            rubric.assessment = savedAssessment;
            await queryRunner.manager.save(rubric);
        }

        // --- 6. SEED SUBMISSIONS & EVALUATIONS ---
        console.log('📊 Seeding Submissions & Evaluations...');
        const student = studentUsers[0];

        const submission = new Submission();
        submission.assessment = savedAssessment;
        submission.user = student;
        submission.status = SubmissionStatus.SUBMITTED;
        const savedSubmission = await queryRunner.manager.save(submission);

        // 👈 Updated: Seed Submission Resource instead of direct URL
        const submissionResource = new SubmissionResource();
        submissionResource.submission = savedSubmission;
        const resource = new Resource();
        resource.title = 'Project Proposal.pdf';
        resource.type = ResourceType.FILE;
        resource.url = faker.internet.url();
        resource.owner = `Student:${student.id}`;
        await queryRunner.manager.save(resource);

        submissionResource.resource = resource;
        await queryRunner.manager.save(submissionResource);

        const evaluation = new Evaluation();
        evaluation.submission = savedSubmission;
        evaluation.score = faker.number.int({ min: 60, max: 100 });
        evaluation.evaluationType = EvaluationType.AI;
        evaluation.feedback = "Good work.";
        await queryRunner.manager.save(evaluation);

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
            payment.tokenPackage = faker.helpers.arrayElement(tokenPackages);
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