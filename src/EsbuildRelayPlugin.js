const fs = require("fs/promises")
const crypto = require("crypto")

const { print, parse } = require("graphql")

const relayPluginOnLoadHandler = (loader) => async (args) => {
	let contents = await fs.readFile(args.path, "utf8")

	if (contents.includes("graphql`")) {
		let imports = []

		contents = contents.replaceAll(/graphql`([\s\S]*?)`/gm, (match, query) => {
			const formatted = print(parse(query))
			const name = /(fragment|mutation|query) (\w+)/.exec(formatted)[2]
			let id = `graphql__${crypto.randomBytes(10).toString("hex")}`
			imports.push(`import ${id} from "./__generated__/${name}.graphql.ts";`)
			return id
		});

		contents = imports.join("\n") + contents
	}

	return {
		contents,
		loader,
	}
}

class EsbuildRelayPlugin {
	name = "relay"

	setup(build) {
		build.onLoad({ filter: /\.tsx$/, namespace: "" }, relayPluginOnLoadHandler("tsx"))
		build.onLoad({ filter: /\.ts$/, namespace: "" }, relayPluginOnLoadHandler("ts"))
	}
}

module.exports = {
	EsbuildRelayPlugin,
}
