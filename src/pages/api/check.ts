import { type NextMiddleware, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { PuzzleState, type Challenge } from "../../utils";

export const config = {
  // eslint-disable-next-line @typescript-eslint/quotes
  runtime: "edge"
};

const handler: NextMiddleware = async (req) => {
  if (req.method !== `GET`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Only GET requests are accepted!`
    });
  }

  const { searchParams } = new URL(req.url);
  const puzzleID = searchParams.get(`puzzle`);
  const guesses = searchParams.get(`guesses`);

  if (typeof puzzleID !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "puzzle" parameter`
    });
  }

  if (typeof guesses !== `string`) {
    return NextResponse.json(null, {
      status: 400,
      statusText: `Received invalid value for "guesses" parameter`
    });
  }

  const cachedPuzzle = await get<Challenge>(puzzleID);

  if (typeof cachedPuzzle === `undefined`) {
    return NextResponse.json(null, {
      status: 500,
      statusText: `Could not retrieve a puzzle for id: ${puzzleID}`
    });
  }

  return NextResponse.json(
    guesses
      .split(`,`)
      .map((guess) => PuzzleState.compare(guess, cachedPuzzle[2])),
    {
      status: 200,
      headers: {
        "Cache-Control": `max-age=0, s-maxage=86400`
      }
    }
  );
};

export default handler;

/*
const puzzles: Record<DateKey, Challenge> = {
  "03-05-2023_5x5": [
    70,
    "emjalnioreweyxlrtwdryradb",
    "jerrydrawnelbowextradimly"
  ],
  "03-05-2023_5x6": [
    188,
    "acyuambaAdlfciqnzfinhetruFperl",
    "fannycheapequalclimbfraudfritz"
  ],
  "03-05-2023_5x7": [
    107,
    "dskrhaaylbBlagrntreocAaoaelckftyvho",
    "valorblokebatchflaskyachtdearygroan"
  ],
  "03-05-2023_5x8": [
    162,
    "opefrdckydftdyilacuyAkkurwdEAptohmlaatOr",
    "cloudkayakhuffyclerkadaptdreamwittydroop"
  ],
  "03-05-2023_6x5": [
    237,
    "eodcfrgneeqlDrusiuebntbsyitobe",
    "bygonebisquedefectborderinsult"
  ],
  "03-05-2023_6x6": [
    129,
    "sircababndrikiEnaYypcdEbheBfoNsptAll",
    "banishdeftlycreakycapperbobbinisland"
  ],
  "03-05-2023_6x7": [
    157,
    "fcelgcsemgraedcnrtCRxAulfehaiaedridoithDyc",
    "glitchexoduschaffecreamycratercandidglider"
  ],
  "03-05-2023_6x8": [
    68,
    "tnilstgaRneEegavarygarlNfeTobryeechREoIehdnieLTa",
    "igniteforageclergyelevenastraybannereditorhealth"
  ],
  "03-05-2023_7x5": [
    35,
    "nIentsresdkeovcfdulipyereaboivFwlCl",
    "viscousfranklydeprivebowlinedeflect"
  ],
  "03-05-2023_7x6": [
    176,
    "gAbGnldlevnarYvnalabaoegewddmsgyihieuAirgo",
    "hangmangangwaydivulgevillagedisobeyboarder"
  ],
  "03-05-2023_7x7": [
    101,
    "frigepiryeRAigertrOntiaocnndAgIofgcadmswtdinlavUa",
    "antacidengravediscordfrigatealimonigratifygrownup"
  ],
  "03-05-2023_7x8": [
    203,
    "EoebESlbOoTdhnWraeocsaoaagtsEcretetdikcacrslnatSlysnIeAT",
    "earnestcottageworldlyeasiestenclosebookendcarcasshabitat"
  ],
  "03-05-2023_8x5": [
    188,
    "gOApnnymetnorbemEdaiOieCoooalxetdatctidp",
    "boatloadantidoteeconomicappendixgeometry"
  ],
  "03-05-2023_8x6": [
    80,
    "mdlDEfceAkhaatadcnxnotlybtuAfaibameifinoarccudrf",
    "bordeauxartifactfallbackdynamitehandcuffcomedian"
  ],
  "03-05-2023_8x7": [
    174,
    "nrlrbenDvmcRErafoebrrcwcaeduoovahNutiinSrtecyinoeeohvyae",
    "barnyardflorencebrochurewheneverenormousadvocatevicinity"
  ],
  "03-05-2023_8x8": [
    205,
    "lnaouccdphcemtoneIraeiloraoenimtlvnfiesrigtrtaoillrhnnbiuyeiehtM",
    "hellbenthellfirecinnamonvirtuosoairplanehomicidegratuityintercom"
  ],
  "03-06-2023_5x5": [
    233,
    "yoiiloLruTrbgicCmnmpemhah",
    "implyblurtchinochoirgemma"
  ],
  "03-06-2023_5x6": [
    105,
    "yakcladAeobordAbiihlrhrnclgdrs",
    "brandgrailhydracheckbasildrool"
  ],
  "03-06-2023_5x7": [
    183,
    "cukbNnwfUpedrhdiacddtiatmevnhehrcta",
    "draindebutchampchunkeventditchdwarf"
  ],
  "03-06-2023_5x8": [
    248,
    "yvordAiieutaTraacarfogayttlhsrtbnRcrvese",
    "voterarenavitalfacetgassycurryhoardbritt"
  ],
  "03-06-2023_6x5": [
    38,
    "nrdtpeaunelEoragxPlnagcelniccl",
    "internglancegallopcancerduplex"
  ],
  "03-06-2023_6x6": [
    53,
    "grcHbsuthGlaareeavammbrodhsieyusgirT",
    "higherbrightvolumegrassyabacusdreamt"
  ],
  "03-06-2023_6x7": [
    85,
    "eofdecdtompntarhhryyRbaoyeaehrarihidueodNm",
    "depictheaderheydayformerhurrahdominobotany"
  ],
  "03-06-2023_6x8": [
    121,
    "ssoawaotbosoprydEegbfagllAimlmwaOThastrsrynllswo",
    "wallophardlywarmerassessgambitfootsygallowboston"
  ],
  "03-06-2023_7x5": [
    128,
    "sAeuecoioafnasArlcudistggAohebREItf",
    "caboosefatigueairheadcutlassforeign"
  ],
  "03-06-2023_7x6": [
    213,
    "ecnuArelnoseffssgetiwaacchdibUNrIeoBleairR",
    "wiseassfanaticbriochecleanergunfireboulder"
  ],
  "03-06-2023_7x7": [
    154,
    "rdtlvyznaitblalihelxarghpeiceElbooaunlcfzdoyeLteg",
    "volcanobulldogclarityfixableheathengrizzlydeplete"
  ],
  "03-06-2023_7x8": [
    237,
    "iRakemosiongfhhpOsucoglIhraacraltqrssSedetgwminrtuEacted",
    "croquetgradualanotherwhiskerdelightfascismcrimsongestapo"
  ],
  "03-06-2023_8x5": [
    211,
    "ollecmsspdiuoresnfoaTdseeliaruoEyaeggedt",
    "desolatedisguiseforetoldgruesomeanyplace"
  ],
  "03-06-2023_8x6": [
    249,
    "cakuetybockdllaqfeimanrsisiasuariereourewtalrbis",
    "disloyalbackfireaquariumwirelessbreakoutcanister"
  ],
  "03-06-2023_8x7": [
    69,
    "taibcnakyloenhcdeonudaaRycloapCespwPHduetivepUerelawaver",
    "evacuateboundaryclincherwoodpeckelephantapplausedriveway"
  ],
  "03-06-2023_8x8": [
    249,
    "daNkoondedapestfCOrncNxitisDafNuCeLelywccfnjldcdenlaitaoiuNeRvar",
    "conceivedistinctcondensewoodlandculinaryexternalflapjackdandruff"
  ],
  "03-01-2023_5x5": [
    38,
    "fURlrrauadHlFgYndAtuhmdya",
    "hurrydramahuffyglandadult"
  ],
  "03-01-2023_5x6": [
    147,
    "hyaaldOhurbLrfloEatiknofllmAsd",
    "birthhollyaloudfelonflaskdrama"
  ],
  "03-01-2023_5x7": [
    78,
    "CRuuPnutgflsppEuyrcejihthtapubrymti",
    "crimpcrushflutejauntgetupbirthyuppy"
  ],
  "03-01-2023_5x8": [
    159,
    "lahybWtyyodbctonrnTdeyoeakhcitlrwaowdrau",
    "worldwearybendyyouthblankwrathcocoaditty"
  ],
  "03-01-2023_6x5": [
    30,
    "aaeBibBnGeurewmlvanbIaEtematbr",
    "bubblebagmanbeaterwaiverinmate"
  ],
  "03-01-2023_6x6": [
    150,
    "lnanAeAeeefDtariowflddunrcpdaemeakbp",
    "dentalabroadappendduffleweakercinema"
  ],
  "03-01-2023_6x7": [
    107,
    "lireeasrmanuohlbCEutdliEtuRygdecceanAomeli",
    "gelatoyellerinducebesideairmancrouchamulet"
  ],
  "03-01-2023_6x8": [
    197,
    "emmncRfhincrreoibeatouuRrelectwbkkdsulsytdueeril",
    "fairerintentkickerbrewerhurdlecustomdoubleclumsy"
  ],
  "03-01-2023_7x5": [
    28,
    "msrttfcpOArstbWOshechetelhrbemnuioa",
    "commentcoasterworshipherselfbathtub"
  ],
  "03-01-2023_7x6": [
    104,
    "perfisikdzluryifwrevnaarumngxitedmlzarhenc",
    "wrinklycadmiumvarnishdrifterfrazzleexpunge"
  ],
  "03-01-2023_7x7": [
    132,
    "hhidawntekdlocreSemvsattcroatteisveoiraiytieeerRc",
    "drasticawesomehostilecritterveterandeviatehickory"
  ],
  "03-01-2023_7x8": [
    80,
    "llaTecsuaailngaatenyrbraejmidrrsdoeiwrlrlkbnetIiewlcsoeg",
    "gestatecrowbarbulldogairlineamnesiajewelryderrickinstall"
  ],
  "03-01-2023_8x5": [
    168,
    "enterodmybatrnciwtiaraosduioctiasTbhlaEd",
    "weirdesthumanoiddiabolicabstractattorney"
  ],
  "03-01-2023_8x6": [
    104,
    "nrowtdbYvoOnialtlyTceegsivlerichoiialhoaAeedllgw",
    "cleverlygeologicantibodywhistlerhallowedaviation"
  ],
  "03-01-2023_8x7": [
    53,
    "nciidkusuraamoUcaOrncNsEebbItiiRlsheiletaenontIdAccditwf",
    "backwardhibiscuscontinuecanisterdomicilefrauleinantidote"
  ],
  "03-01-2023_8x8": [
    107,
    "oeloaceoeabampTreilKiaratfvreNtniusiectcashdgsotmiameitmcopdWdga",
    "happiestamarettobackdoorgalvanicaccustomdefiniteimmortaledgewise"
  ]
};
*/
