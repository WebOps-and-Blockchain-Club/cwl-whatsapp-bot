const express = require("express");
const router = express.Router();
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const { request, gql, GraphQLClient } = require("graphql-request");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();

const graphQLClient = new GraphQLClient("http://localhost:8000/");
const query = gql`
	mutation postWaterData($waterDataInput: WaterDataInput!) {
		postWaterData(WaterDataInput: $waterDataInput) {
			image
			location
			depth
		}
	}
`;

router.post("/message", async (req, res, next) => {
	let coord;
	const image = req.body.MediaUrl0;
	let [depth, location] = req.body.Body.split(";");
	depth = parseInt(depth);
	await fetch(
		`https://api.mapbox.com/geocoding/v5/mapbox.places/${JSON.stringify(
			location
		)}.json?access_token=${process.env.MAPBOX_SECRET_KEY}`
	)
		.then((res) => res.json())
		.then((data) => {
			const [lng, lat] = data.features[0].center;
			coord = { lat, lng };
		})
		.catch((e) => console.log(e));
	const twiml = new MessagingResponse();
	twiml.message("Message received");
	res.writeHead(200, { "Content-Type": "text/xml" });
	const results = await graphQLClient.request(query, {
		waterDataInput: {
			location: JSON.stringify(coord),
			image,
			depth,
		},
	});
	console.log(results);
	res.end(twiml.toString());
});

module.exports = router;
