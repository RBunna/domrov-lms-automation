import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsersTable1771656355452 implements MigrationInterface {
    name = 'AddUsersTable1771656355452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "enrollments" DROP CONSTRAINT "FK_470304681bce2933d3cbb680db8"
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments" DROP CONSTRAINT "FK_de33d443c8ae36800c37c58c929"
        `);
        await queryRunner.query(`
            ALTER TABLE "team_members" DROP CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2"
        `);
        await queryRunner.query(`
            ALTER TABLE "team_members" DROP CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33"
        `);
        await queryRunner.query(`
            ALTER TABLE "teams" DROP CONSTRAINT "FK_7da60bd93ae1e8083c9fc5e164a"
        `);
        await queryRunner.query(`
            ALTER TABLE "teams" DROP CONSTRAINT "FK_6d5c85d3f2602450d1e615afae9"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage_logs" DROP CONSTRAINT "FK_d21a549c521356bda0725494e08"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage_logs" DROP CONSTRAINT "FK_95540e2816ce80527c6e86b97d2"
        `);
        await queryRunner.query(`
            ALTER TABLE "evaluations" DROP CONSTRAINT "FK_fe1def9da41a1bd4e6d9089f65d"
        `);
        await queryRunner.query(`
            ALTER TABLE "assessment_resources" DROP CONSTRAINT "FK_a67915f82af2ffec05a71904961"
        `);
        await queryRunner.query(`
            ALTER TABLE "assessment_resources" DROP CONSTRAINT "FK_94a5d29daca7b4e67b4dcb7e507"
        `);
        await queryRunner.query(`
            ALTER TABLE "submission_resources" DROP CONSTRAINT "FK_3e0fb006edbb165b4d6011c0a54"
        `);
        await queryRunner.query(`
            ALTER TABLE "submission_resources" DROP CONSTRAINT "FK_e55939a2e73ffdf9898902a9c85"
        `);
        await queryRunner.query(`
            ALTER TABLE "submissions" DROP CONSTRAINT "FK_90b8a1228c45f68b9a431cbd559"
        `);
        await queryRunner.query(`
            ALTER TABLE "submissions" DROP CONSTRAINT "FK_eae888413ab8fc63cc48759d46a"
        `);
        await queryRunner.query(`
            ALTER TABLE "assessments" DROP CONSTRAINT "FK_6fea4c57f931900e3db98309b7d"
        `);
        await queryRunner.query(`
            ALTER TABLE "assessments" DROP CONSTRAINT "FK_b4f3db3ac8ac27cfb43c70572bd"
        `);
        await queryRunner.query(`
            ALTER TABLE "classes" DROP CONSTRAINT "FK_3c1268935f1ec61476e488ab876"
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_bb75785331270a8da0860e915a3"
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_4c22f13249ce02f89dc6d226e9c"
        `);
        await queryRunner.query(`
            ALTER TABLE "telegram_chats" DROP CONSTRAINT "FK_829423df0cd93c8f29a7d0c227c"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_1cad2baa6edb423f332ad7ebe18"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_154435de0ddfa1edafd4f701293"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_8a94d9d61a2b05123710b325fbf"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_token_balances" DROP CONSTRAINT "FK_d94c3bc86580bc541a6bf4f653f"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_refresh_token" DROP CONSTRAINT "FK_9e2418637bd2ee8d14c7ccb1e34"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_email_otp" DROP CONSTRAINT "FK_3c5a652662d18a3b8447d04e9ce"
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            ADD CONSTRAINT "FK_de33d443c8ae36800c37c58c929" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            ADD CONSTRAINT "FK_470304681bce2933d3cbb680db8" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "team_members"
            ADD CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "team_members"
            ADD CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "teams"
            ADD CONSTRAINT "FK_6d5c85d3f2602450d1e615afae9" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "teams"
            ADD CONSTRAINT "FK_7da60bd93ae1e8083c9fc5e164a" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage_logs"
            ADD CONSTRAINT "FK_95540e2816ce80527c6e86b97d2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage_logs"
            ADD CONSTRAINT "FK_d21a549c521356bda0725494e08" FOREIGN KEY ("modelId") REFERENCES "platform_ai_models"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "evaluations"
            ADD CONSTRAINT "FK_fe1def9da41a1bd4e6d9089f65d" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assessment_resources"
            ADD CONSTRAINT "FK_a67915f82af2ffec05a71904961" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assessment_resources"
            ADD CONSTRAINT "FK_94a5d29daca7b4e67b4dcb7e507" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "submission_resources"
            ADD CONSTRAINT "FK_e55939a2e73ffdf9898902a9c85" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "submission_resources"
            ADD CONSTRAINT "FK_3e0fb006edbb165b4d6011c0a54" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "submissions"
            ADD CONSTRAINT "FK_eae888413ab8fc63cc48759d46a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "submissions"
            ADD CONSTRAINT "FK_90b8a1228c45f68b9a431cbd559" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assessments"
            ADD CONSTRAINT "FK_b4f3db3ac8ac27cfb43c70572bd" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assessments"
            ADD CONSTRAINT "FK_6fea4c57f931900e3db98309b7d" FOREIGN KEY ("aiModelId") REFERENCES "platform_ai_models"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "classes"
            ADD CONSTRAINT "FK_3c1268935f1ec61476e488ab876" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_accounts"
            ADD CONSTRAINT "FK_4c22f13249ce02f89dc6d226e9c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_accounts"
            ADD CONSTRAINT "FK_bb75785331270a8da0860e915a3" FOREIGN KEY ("providerId") REFERENCES "oauth_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telegram_chats"
            ADD CONSTRAINT "FK_829423df0cd93c8f29a7d0c227c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_1cad2baa6edb423f332ad7ebe18" FOREIGN KEY ("tokenPackageId") REFERENCES "token_packages"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transactions"
            ADD CONSTRAINT "FK_8a94d9d61a2b05123710b325fbf" FOREIGN KEY ("walletId") REFERENCES "user_token_balances"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transactions"
            ADD CONSTRAINT "FK_154435de0ddfa1edafd4f701293" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_token_balances"
            ADD CONSTRAINT "FK_d94c3bc86580bc541a6bf4f653f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_refresh_token"
            ADD CONSTRAINT "FK_9e2418637bd2ee8d14c7ccb1e34" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_email_otp"
            ADD CONSTRAINT "FK_3c5a652662d18a3b8447d04e9ce" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_email_otp" DROP CONSTRAINT "FK_3c5a652662d18a3b8447d04e9ce"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_refresh_token" DROP CONSTRAINT "FK_9e2418637bd2ee8d14c7ccb1e34"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_token_balances" DROP CONSTRAINT "FK_d94c3bc86580bc541a6bf4f653f"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_154435de0ddfa1edafd4f701293"
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_8a94d9d61a2b05123710b325fbf"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_1cad2baa6edb423f332ad7ebe18"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"
        `);
        await queryRunner.query(`
            ALTER TABLE "telegram_chats" DROP CONSTRAINT "FK_829423df0cd93c8f29a7d0c227c"
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_bb75785331270a8da0860e915a3"
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_4c22f13249ce02f89dc6d226e9c"
        `);
        await queryRunner.query(`
            ALTER TABLE "classes" DROP CONSTRAINT "FK_3c1268935f1ec61476e488ab876"
        `);
        await queryRunner.query(`
            ALTER TABLE "assessments" DROP CONSTRAINT "FK_6fea4c57f931900e3db98309b7d"
        `);
        await queryRunner.query(`
            ALTER TABLE "assessments" DROP CONSTRAINT "FK_b4f3db3ac8ac27cfb43c70572bd"
        `);
        await queryRunner.query(`
            ALTER TABLE "submissions" DROP CONSTRAINT "FK_90b8a1228c45f68b9a431cbd559"
        `);
        await queryRunner.query(`
            ALTER TABLE "submissions" DROP CONSTRAINT "FK_eae888413ab8fc63cc48759d46a"
        `);
        await queryRunner.query(`
            ALTER TABLE "submission_resources" DROP CONSTRAINT "FK_3e0fb006edbb165b4d6011c0a54"
        `);
        await queryRunner.query(`
            ALTER TABLE "submission_resources" DROP CONSTRAINT "FK_e55939a2e73ffdf9898902a9c85"
        `);
        await queryRunner.query(`
            ALTER TABLE "assessment_resources" DROP CONSTRAINT "FK_94a5d29daca7b4e67b4dcb7e507"
        `);
        await queryRunner.query(`
            ALTER TABLE "assessment_resources" DROP CONSTRAINT "FK_a67915f82af2ffec05a71904961"
        `);
        await queryRunner.query(`
            ALTER TABLE "evaluations" DROP CONSTRAINT "FK_fe1def9da41a1bd4e6d9089f65d"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage_logs" DROP CONSTRAINT "FK_d21a549c521356bda0725494e08"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage_logs" DROP CONSTRAINT "FK_95540e2816ce80527c6e86b97d2"
        `);
        await queryRunner.query(`
            ALTER TABLE "teams" DROP CONSTRAINT "FK_7da60bd93ae1e8083c9fc5e164a"
        `);
        await queryRunner.query(`
            ALTER TABLE "teams" DROP CONSTRAINT "FK_6d5c85d3f2602450d1e615afae9"
        `);
        await queryRunner.query(`
            ALTER TABLE "team_members" DROP CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2"
        `);
        await queryRunner.query(`
            ALTER TABLE "team_members" DROP CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33"
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments" DROP CONSTRAINT "FK_470304681bce2933d3cbb680db8"
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments" DROP CONSTRAINT "FK_de33d443c8ae36800c37c58c929"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_email_otp"
            ADD CONSTRAINT "FK_3c5a652662d18a3b8447d04e9ce" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_refresh_token"
            ADD CONSTRAINT "FK_9e2418637bd2ee8d14c7ccb1e34" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_token_balances"
            ADD CONSTRAINT "FK_d94c3bc86580bc541a6bf4f653f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transactions"
            ADD CONSTRAINT "FK_8a94d9d61a2b05123710b325fbf" FOREIGN KEY ("walletId") REFERENCES "user_token_balances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "wallet_transactions"
            ADD CONSTRAINT "FK_154435de0ddfa1edafd4f701293" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_1cad2baa6edb423f332ad7ebe18" FOREIGN KEY ("tokenPackageId") REFERENCES "token_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "telegram_chats"
            ADD CONSTRAINT "FK_829423df0cd93c8f29a7d0c227c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_accounts"
            ADD CONSTRAINT "FK_4c22f13249ce02f89dc6d226e9c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "oauth_accounts"
            ADD CONSTRAINT "FK_bb75785331270a8da0860e915a3" FOREIGN KEY ("providerId") REFERENCES "oauth_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "classes"
            ADD CONSTRAINT "FK_3c1268935f1ec61476e488ab876" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assessments"
            ADD CONSTRAINT "FK_b4f3db3ac8ac27cfb43c70572bd" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assessments"
            ADD CONSTRAINT "FK_6fea4c57f931900e3db98309b7d" FOREIGN KEY ("aiModelId") REFERENCES "platform_ai_models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "submissions"
            ADD CONSTRAINT "FK_eae888413ab8fc63cc48759d46a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "submissions"
            ADD CONSTRAINT "FK_90b8a1228c45f68b9a431cbd559" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "submission_resources"
            ADD CONSTRAINT "FK_e55939a2e73ffdf9898902a9c85" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "submission_resources"
            ADD CONSTRAINT "FK_3e0fb006edbb165b4d6011c0a54" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assessment_resources"
            ADD CONSTRAINT "FK_94a5d29daca7b4e67b4dcb7e507" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assessment_resources"
            ADD CONSTRAINT "FK_a67915f82af2ffec05a71904961" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "evaluations"
            ADD CONSTRAINT "FK_fe1def9da41a1bd4e6d9089f65d" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage_logs"
            ADD CONSTRAINT "FK_95540e2816ce80527c6e86b97d2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage_logs"
            ADD CONSTRAINT "FK_d21a549c521356bda0725494e08" FOREIGN KEY ("modelId") REFERENCES "platform_ai_models"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "teams"
            ADD CONSTRAINT "FK_6d5c85d3f2602450d1e615afae9" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "teams"
            ADD CONSTRAINT "FK_7da60bd93ae1e8083c9fc5e164a" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "team_members"
            ADD CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "team_members"
            ADD CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            ADD CONSTRAINT "FK_de33d443c8ae36800c37c58c929" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            ADD CONSTRAINT "FK_470304681bce2933d3cbb680db8" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

}
