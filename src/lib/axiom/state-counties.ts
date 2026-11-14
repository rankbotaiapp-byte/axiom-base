/** Counties beyond the six hubs already stored for a state. Hubs stay first in the sweep. */
export type RegistryCounty = {
  county: string;
  cities: readonly string[];
  areaCode: string;
};

export function parseCounties(block: string): RegistryCounty[] {
  return block
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const [name, cityList, areaCode] = line.split("|");
      if (!name || !cityList || !areaCode) throw new Error(`Bad county line: ${line}`);
      const county = name.endsWith(" County") ? name : `${name} County`;
      const cities = cityList.split(";").filter((city) => city.length > 0);
      if (cities.length === 0) throw new Error(`County has no city: ${line}`);
      return { county, cities, areaCode };
    });
}

export const TEXAS_MORE = parseCounties(`
Anderson|Palestine|903
Andrews|Andrews|432
Angelina|Lufkin|936
Aransas|Rockport|361
Archer|Archer City|940
Armstrong|Claude|806
Atascosa|Jourdanton|830
Austin|Bellville|979
Bailey|Muleshoe|806
Bandera|Bandera|830
Bastrop|Bastrop|512
Baylor|Seymour|940
Bee|Beeville|361
Bell|Belton|254
Blanco|Johnson City|830
Borden|Gail|806
Bosque|Meridian|254
Bowie|New Boston|903
Brazoria|Angleton|979
Brazos|Bryan|979
Brewster|Alpine|432
Briscoe|Silverton|806
Brooks|Falfurrias|361
Brown|Brownwood|325
Burleson|Caldwell|979
Burnet|Burnet|512
Caldwell|Lockhart|512
Calhoun|Port Lavaca|361
Callahan|Baird|325
Cameron|Brownsville|956
Camp|Pittsburg|903
Carson|Panhandle|806
Cass|Linden|903
Castro|Dimmitt|806
Chambers|Anahuac|409
Cherokee|Rusk|903
Childress|Childress|940
Clay|Henrietta|940
Cochran|Morton|806
Coke|Robert Lee|325
Coleman|Coleman|325
Collingsworth|Wellington|806
Colorado|Columbus|979
Comal|New Braunfels|830
Comanche|Comanche|325
Concho|Paint Rock|325
Cooke|Gainesville|940
Coryell|Gatesville|254
Cottle|Paducah|806
Crane|Crane|432
Crockett|Ozona|325
Crosby|Crosbyton|806
Culberson|Van Horn|432
Dallam|Dalhart|806
Dawson|Lamesa|806
Deaf Smith|Hereford|806
Delta|Cooper|903
Denton|Denton|940
DeWitt|Cuero|361
Dickens|Dickens|806
Dimmit|Carrizo Springs|830
Donley|Clarendon|806
Duval|San Diego|361
Eastland|Eastland|254
Ector|Odessa|432
Edwards|Rocksprings|830
El Paso|El Paso|915
Ellis|Waxahachie|972
Erath|Stephenville|254
Falls|Marlin|254
Fannin|Bonham|903
Fayette|La Grange|979
Fisher|Roby|325
Floyd|Floydada|806
Foard|Crowell|940
Fort Bend|Richmond|281
Franklin|Mount Vernon|903
Freestone|Fairfield|903
Frio|Pearsall|830
Gaines|Seminole|432
Galveston|Galveston|409
Garza|Post|806
Gillespie|Fredericksburg|830
Glasscock|Garden City|432
Goliad|Goliad|361
Gonzales|Gonzales|830
Gray|Pampa|806
Grayson|Sherman|903
Gregg|Longview|903
Grimes|Anderson|936
Guadalupe|Seguin|830
Hale|Plainview|806
Hall|Memphis|806
Hamilton|Hamilton|254
Hansford|Spearman|806
Hardeman|Quanah|940
Hardin|Kountze|409
Harrison|Marshall|903
Hartley|Channing|806
Haskell|Haskell|940
Hays|San Marcos|512
Hemphill|Canadian|806
Henderson|Athens|903
Hidalgo|Edinburg|956
Hill|Hillsboro|254
Hockley|Levelland|806
Hood|Granbury|817
Hopkins|Sulphur Springs|903
Houston|Crockett|936
Howard|Big Spring|432
Hudspeth|Sierra Blanca|915
Hunt|Greenville|903
Hutchinson|Stinnett|806
Irion|Mertzon|325
Jack|Jacksboro|940
Jackson|Edna|361
Jasper|Jasper|409
Jeff Davis|Fort Davis|432
Jefferson|Beaumont|409
Jim Hogg|Hebbronville|956
Jim Wells|Alice|361
Johnson|Cleburne|817
Jones|Anson|325
Karnes|Karnes City|830
Kaufman|Kaufman|972
Kendall|Boerne|830
Kenedy|Sarita|361
Kent|Jayton|806
Kerr|Kerrville|830
Kimble|Junction|325
King|Guthrie|806
Kinney|Brackettville|830
Kleberg|Kingsville|361
Knox|Benjamin|940
La Salle|Cotulla|830
Lamar|Paris|903
Lamb|Littlefield|806
Lampasas|Lampasas|512
Lavaca|Hallettsville|361
Lee|Giddings|979
Leon|Centerville|903
Liberty|Liberty|936
Limestone|Groesbeck|254
Lipscomb|Lipscomb|806
Live Oak|George West|361
Llano|Llano|325
Loving|Mentone|432
Lubbock|Lubbock|806
Lynn|Tahoka|806
Madison|Madisonville|936
Marion|Jefferson|903
Martin|Stanton|432
Mason|Mason|325
Matagorda|Bay City|979
Maverick|Eagle Pass|830
McCulloch|Brady|325
McLennan|Waco|254
McMullen|Tilden|361
Medina|Hondo|830
Menard|Menard|325
Midland|Midland|432
Milam|Cameron|254
Mills|Goldthwaite|325
Mitchell|Colorado City|325
Montague|Montague|940
Montgomery|Conroe|936
Moore|Dumas|806
Morris|Daingerfield|903
Motley|Matador|806
Nacogdoches|Nacogdoches|936
Navarro|Corsicana|903
Newton|Newton|409
Nolan|Sweetwater|325
Nueces|Corpus Christi|361
Ochiltree|Perryton|806
Oldham|Vega|806
Orange|Orange|409
Palo Pinto|Palo Pinto|940
Panola|Carthage|903
Parker|Weatherford|817
Parmer|Farwell|806
Pecos|Fort Stockton|432
Polk|Livingston|936
Potter|Amarillo|806
Presidio|Marfa|432
Rains|Emory|903
Randall|Canyon|806
Reagan|Big Lake|325
Real|Leakey|830
Red River|Clarksville|903
Reeves|Pecos|432
Refugio|Refugio|361
Roberts|Miami|806
Robertson|Franklin|979
Rockwall|Rockwall|972
Runnels|Ballinger|325
Rusk|Henderson|903
Sabine|Hemphill|409
San Augustine|San Augustine|936
San Jacinto|Coldspring|936
San Patricio|Sinton|361
San Saba|San Saba|325
Schleicher|Eldorado|325
Scurry|Snyder|325
Shackelford|Albany|325
Shelby|Center|936
Sherman|Stratford|806
Smith|Tyler|903
Somervell|Glen Rose|254
Starr|Rio Grande City|956
Stephens|Breckenridge|254
Sterling|Sterling City|325
Stonewall|Aspermont|940
Sutton|Sonora|325
Swisher|Tulia|806
Taylor|Abilene|325
Terrell|Sanderson|432
Terry|Brownfield|806
Throckmorton|Throckmorton|940
Titus|Mount Pleasant|903
Tom Green|San Angelo|325
Trinity|Trinity|936
Tyler|Woodville|409
Upshur|Gilmer|903
Upton|Rankin|432
Uvalde|Uvalde|830
Val Verde|Del Rio|830
Van Zandt|Canton|903
Victoria|Victoria|361
Walker|Huntsville|936
Waller|Hempstead|979
Ward|Monahans|432
Washington|Brenham|979
Webb|Laredo|956
Wharton|Wharton|979
Wheeler|Wheeler|806
Wichita|Wichita Falls|940
Wilbarger|Vernon|940
Willacy|Raymondville|956
Williamson|Georgetown|512
Wilson|Floresville|830
Winkler|Kermit|432
Wise|Decatur|940
Wood|Quitman|903
Yoakum|Plains|806
Young|Olney|940
Zapata|Zapata|956
Zavala|Crystal City|830
`);

export const FLORIDA_MORE = parseCounties(`
Alachua|Gainesville|352
Baker|Macclenny|904
Bay|Panama City|850
Bradford|Starke|904
Brevard|Viera|321
Calhoun|Blountstown|850
Charlotte|Punta Gorda|941
Citrus|Inverness|352
Clay|Green Cove Springs|904
Collier|Naples|239
Columbia|Lake City|386
DeSoto|Arcadia|863
Dixie|Cross City|352
Escambia|Pensacola|850
Flagler|Bunnell|386
Franklin|Apalachicola|850
Gadsden|Quincy|850
Gilchrist|Trenton|352
Glades|Moore Haven|863
Gulf|Port St. Joe|850
Hamilton|Jasper|386
Hardee|Wauchula|863
Hendry|LaBelle|863
Hernando|Brooksville|352
Highlands|Sebring|863
Holmes|Bonifay|850
Indian River|Vero Beach|772
Jackson|Marianna|850
Jefferson|Monticello|850
Lafayette|Mayo|386
Lake|Tavares|352
Lee|Fort Myers|239
Leon|Tallahassee|850
Levy|Bronson|352
Liberty|Bristol|850
Madison|Madison|850
Manatee|Bradenton|941
Marion|Ocala|352
Martin|Stuart|772
Monroe|Key West|305
Nassau|Fernandina Beach|904
Okaloosa|Crestview|850
Okeechobee|Okeechobee|863
Osceola|Kissimmee|407
Pasco|Dade City|727
Pinellas|Clearwater|727
Polk|Bartow|863
Putnam|Palatka|386
St. Johns|St. Augustine|904
St. Lucie|Fort Pierce|772
Santa Rosa|Milton|850
Sarasota|Sarasota|941
Seminole|Sanford|407
Sumter|Bushnell|352
Suwannee|Live Oak|386
Taylor|Perry|850
Union|Lake Butler|386
Volusia|DeLand|386
Wakulla|Crawfordville|850
Walton|DeFuniak Springs|850
Washington|Chipley|850
`);

export const CALIFORNIA_MORE = parseCounties(`
Alpine|Markleeville|530
Amador|Jackson|209
Butte|Oroville|530
Calaveras|San Andreas|209
Colusa|Colusa|530
Contra Costa|Martinez|925
Del Norte|Crescent City|707
El Dorado|Placerville|530
Fresno|Fresno|559
Glenn|Willows|530
Humboldt|Eureka|707
Imperial|El Centro|760
Inyo|Independence|760
Kern|Bakersfield|661
Kings|Hanford|559
Lake|Lakeport|707
Lassen|Susanville|530
Madera|Madera|559
Marin|San Rafael|415
Mariposa|Mariposa|209
Mendocino|Ukiah|707
Merced|Merced|209
Modoc|Alturas|530
Mono|Bridgeport|760
Monterey|Salinas|831
Napa|Napa|707
Nevada|Nevada City|530
Placer|Auburn|530
Plumas|Quincy|530
Riverside|Riverside|951
San Benito|Hollister|831
San Bernardino|San Bernardino|909
San Francisco|San Francisco|415
San Joaquin|Stockton|209
San Luis Obispo|San Luis Obispo|805
San Mateo|Redwood City|650
Santa Barbara|Santa Barbara|805
Santa Cruz|Santa Cruz|831
Shasta|Redding|530
Sierra|Downieville|530
Siskiyou|Yreka|530
Solano|Fairfield|707
Sonoma|Santa Rosa|707
Stanislaus|Modesto|209
Sutter|Yuba City|530
Tehama|Red Bluff|530
Trinity|Weaverville|530
Tulare|Visalia|559
Tuolumne|Sonora|209
Ventura|Ventura|805
Yolo|Woodland|530
Yuba|Marysville|530
`);

export const PENNSYLVANIA_MORE = parseCounties(`
Adams|Gettysburg|717
Armstrong|Kittanning|724
Beaver|Beaver|724
Bedford|Bedford|814
Berks|Reading|610
Blair|Hollidaysburg|814
Bradford|Towanda|570
Butler|Butler|724
Cambria|Ebensburg|814
Cameron|Emporium|814
Carbon|Jim Thorpe|570
Centre|Bellefonte|814
Chester|West Chester|610
Clarion|Clarion|814
Clearfield|Clearfield|814
Clinton|Lock Haven|570
Columbia|Bloomsburg|570
Crawford|Meadville|814
Cumberland|Carlisle|717
Dauphin|Harrisburg|717
Elk|Ridgway|814
Erie|Erie|814
Fayette|Uniontown|724
Forest|Tionesta|814
Franklin|Chambersburg|717
Fulton|McConnellsburg|717
Greene|Waynesburg|724
Huntingdon|Huntingdon|814
Indiana|Indiana|724
Jefferson|Brookville|814
Juniata|Mifflintown|717
Lackawanna|Scranton|570
Lawrence|New Castle|724
Lebanon|Lebanon|717
Lehigh|Allentown|610
Luzerne|Wilkes-Barre|570
Lycoming|Williamsport|570
McKean|Smethport|814
Mercer|Mercer|724
Mifflin|Lewistown|717
Monroe|Stroudsburg|570
Montour|Danville|570
Northampton|Easton|610
Northumberland|Sunbury|570
Perry|New Bloomfield|717
Pike|Milford|570
Potter|Coudersport|814
Schuylkill|Pottsville|570
Snyder|Middleburg|570
Somerset|Somerset|814
Sullivan|Laporte|570
Susquehanna|Montrose|570
Tioga|Wellsboro|570
Union|Lewisburg|570
Venango|Franklin|814
Warren|Warren|814
Washington|Washington|724
Wayne|Honesdale|570
Westmoreland|Greensburg|724
Wyoming|Tunkhannock|570
York|York|717
`);

export const NEW_YORK_MORE = parseCounties(`
Albany|Albany|518
Allegany|Belmont|585
Bronx|Bronx|718
Broome|Binghamton|607
Cattaraugus|Little Valley|716
Cayuga|Auburn|315
Chautauqua|Mayville|716
Chemung|Elmira|607
Chenango|Norwich|607
Clinton|Plattsburgh|518
Columbia|Hudson|518
Cortland|Cortland|607
Delaware|Delhi|607
Dutchess|Poughkeepsie|845
Erie|Buffalo|716
Essex|Elizabethtown|518
Franklin|Malone|518
Fulton|Johnstown|518
Genesee|Batavia|585
Greene|Catskill|518
Hamilton|Lake Pleasant|518
Herkimer|Herkimer|315
Jefferson|Watertown|315
Lewis|Lowville|315
Livingston|Geneseo|585
Madison|Wampsville|315
Monroe|Rochester|585
Montgomery|Fonda|518
Niagara|Lockport|716
Oneida|Utica|315
Onondaga|Syracuse|315
Ontario|Canandaigua|585
Orange|Goshen|845
Orleans|Albion|585
Oswego|Oswego|315
Otsego|Cooperstown|607
Putnam|Carmel|845
Rensselaer|Troy|518
Richmond|Staten Island|718
Rockland|New City|845
St. Lawrence|Canton|315
Saratoga|Ballston Spa|518
Schenectady|Schenectady|518
Schoharie|Schoharie|518
Schuyler|Watkins Glen|607
Seneca|Waterloo|315
Steuben|Bath|607
Sullivan|Monticello|845
Tioga|Owego|607
Tompkins|Ithaca|607
Ulster|Kingston|845
Warren|Queensbury|518
Washington|Fort Edward|518
Wayne|Lyons|315
Wyoming|Warsaw|585
Yates|Penn Yan|315
`);
