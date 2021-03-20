import * as core from "@actions/core";
import * as github from "@actions/github";

async function run(): Promise<void> {
	try {
		const githubToken = core.getInput("github_token", { required: true });
		const tag = core.getInput("tag", { required: true });
		const tagPrefix = core.getInput("tag_prefix", { required: false });
		const create = core.getInput("create", { required: false }) === "true";
		const failIfExists =
			core.getInput("fail_if_exists", { required: false }) === "true";

		const gitTag = tagPrefix + tag;
		const gh = github.getOctokit(githubToken);

		const tagRef = `refs/tags/${gitTag}`;

		const existingRefs = await gh.git.listMatchingRefs({
			...github.context.repo,
			ref: `tags/${gitTag}`,
		});

		core.debug(`Existing refs: ${JSON.stringify(existingRefs)}`);

		const exists = existingRefs.data.some(d => d.ref === `tags/${gitTag}`);

		if (exists && failIfExists) {
			throw new Error(
				`Tag "${gitTag}" exists, but it should not! (fail_if_exists is set)`
			);
		}

		if (create && !exists) {
			core.info(`Creating tag "${gitTag}".`);
			await gh.git.createRef({
				...github.context.repo,
				ref: tagRef,
				sha: github.context.sha,
			});
		}

		core.setOutput("exists", JSON.stringify(exists));
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
