//#region node_modules/.nitro/vite/services/ssr/assets/niches-ClhwYU5r.js
var NICHES = {
	location: {
		niche: "location",
		label: "Storefront",
		kicker: "They come to you",
		blurb: "Barbers, salons, studios — a chair, a room, a line out the door.",
		defaultName: "Atlas Cuts",
		tagline: "Precision cuts. No waiting around.",
		description: "A quiet two-chair shop. Book a chair, skip the walk-in list, leave looking finished.",
		address: "12 Pine Street",
		ringColor: "#E7B48A",
		heroImageUrl: "/media/barber-hero.jpg",
		heroVideoUrl: "/media/barber-hero.mp4",
		heroBlendPercent: 58,
		services: [
			{
				name: "Signature cut",
				description: "Consultation, cut, finish.",
				durationMin: 45,
				priceCents: 4800
			},
			{
				name: "Skin fade",
				description: "Tight blend, razor line.",
				durationMin: 50,
				priceCents: 5400
			},
			{
				name: "Beard sculpt",
				description: "Shape, line-up, oil.",
				durationMin: 25,
				priceCents: 2800
			}
		],
		employees: [{
			displayName: "Jordan Hale",
			title: "Lead barber",
			bio: "Fades and classic tapers. Calm chair, sharp lines.",
			avatarUrl: "/media/sal.jpg",
			serviceIndexes: [
				0,
				1,
				2
			]
		}, {
			displayName: "Reese Quinn",
			title: "Barber",
			bio: "Texture and finishes. The haircut you forget you have — in a good way.",
			avatarUrl: "/media/marco.jpg",
			serviceIndexes: [0, 1]
		}],
		portfolio: [
			{
				employeeIndex: 0,
				imageUrl: "/media/barber-work-1.jpg",
				caption: "House fade"
			},
			{
				employeeIndex: 0,
				imageUrl: "/media/barber-work-2.jpg",
				caption: "Shave"
			},
			{
				employeeIndex: 1,
				imageUrl: "/media/barber-work-1.jpg",
				caption: "Crop"
			}
		]
	},
	field: {
		niche: "field",
		label: "Field service",
		kicker: "You go to them",
		blurb: "Auto, HVAC, trades — a van, a bay, a job that starts on the curb.",
		defaultName: "Northline Repair",
		tagline: "We come to the curb.",
		description: "Mobile diagnostics plus a bay for the work that needs a hoist. Plain-language quotes.",
		address: "Service radius: 15 miles",
		ringColor: "#7EC8E3",
		heroImageUrl: "/media/auto-hero.jpg",
		heroVideoUrl: "/media/auto-hero.mp4",
		heroBlendPercent: 64,
		services: [
			{
				name: "Driveway diagnostic",
				description: "Scan and a plain-language report.",
				durationMin: 60,
				priceCents: 12900
			},
			{
				name: "Oil + filter",
				description: "At the curb or in the bay.",
				durationMin: 45,
				priceCents: 8900
			},
			{
				name: "Mobile rescue",
				description: "Battery, jump, no-start triage.",
				durationMin: 50,
				priceCents: 14900
			}
		],
		employees: [{
			displayName: "Chris Dalton",
			title: "Lead technician",
			bio: "Drivability and brakes. Listens to the engine — and to you.",
			avatarUrl: "/media/dana.jpg",
			serviceIndexes: [0, 1]
		}, {
			displayName: "Avery Knox",
			title: "Mobile tech",
			bio: "The van is a rolling bay. Fast on the jobs that should not need a tow.",
			avatarUrl: "/media/gabe.jpg",
			serviceIndexes: [0, 2]
		}],
		portfolio: [
			{
				employeeIndex: 0,
				imageUrl: "/media/auto-work-1.jpg",
				caption: "Brake job"
			},
			{
				employeeIndex: 0,
				imageUrl: "/media/auto-work-2.jpg",
				caption: "Bay work"
			},
			{
				employeeIndex: 1,
				imageUrl: "/media/auto-work-1.jpg",
				caption: "Curb-side"
			}
		]
	}
};
var DEFAULT_HOURS = {
	mon: "09:00-18:00",
	tue: "09:00-18:00",
	wed: "09:00-18:00",
	thu: "09:00-18:00",
	fri: "09:00-18:00",
	sat: "09:00-16:00",
	sun: "closed"
};
var WEEKDAYS = [
	["mon", "Mon"],
	["tue", "Tue"],
	["wed", "Wed"],
	["thu", "Thu"],
	["fri", "Fri"],
	["sat", "Sat"],
	["sun", "Sun"]
];
//#endregion
export { NICHES as n, WEEKDAYS as r, DEFAULT_HOURS as t };
