/* Constants */
const MaximumNameLength = 255;
const noHelp = "";
const detailedHelp = "Enter a name up to 255 characters in size. Most valid C# identifiers are allowed."; // localize

export interface IValidationResult {
  isInvalid: boolean;
  help: string;
}

export function validate(name: string): IValidationResult {
  let help: string = noHelp;
  // Note: Disabling encoding check to err the side of lax validation.
  // A valid property name should also be XML-serializable.
  // Hence, only allowing names that don't require special encoding for network transmission.
  // var encoded: string = tryEncode(name);
  // var success: boolean = (name === encoded);
  let success = true;

  if (success) {
    success = name.length <= MaximumNameLength;
    if (success) {
      success = IsValidIdentifier(name);
    }
  }

  if (!success) {
    help = detailedHelp;
  }

  return { isInvalid: !success, help: help };
}

/*
function tryEncode(name: string): string {
    var encoded: string = null;

    try {
        encoded = encodeURIComponent(name);
    } catch (error) {
        console.error("tryEncode", "Error encoding:", name, error);

        encoded = null;
    }

    return encoded;
}
*/

// Port of http://referencesource.microsoft.com/#System/compmod/microsoft/csharp/csharpcodeprovider.cs,7b5c20ff8d28dfa7
function IsValidIdentifier(value: string): boolean {
  // identifiers must be 1 char or longer
  if (!value) {
    return false;
  }

  if (value.length > 512) {
    return false;
  }

  // Note: Disabling keyword check to err the side of lax validation.
  // identifiers cannot be a keyword, unless they are escaped with an '@'
  /*
    if (value[0] !== "@") {
        if (IsKeyword(value)) {
            return false;
        }
    } else {
        value = value.substring(1);
    }
    */

  return IsValidLanguageIndependentIdentifier(value);
}

/*
var keywords: string[][] = [
    // 2 characters
    [
        "as",
        "do",
        "if",
        "in",
        "is",
    ],
    // 3 characters
    [
        "for",
        "int",
        "new",
        "out",
        "ref",
        "try",
    ],
    // 4 characters
    [
        "base",
        "bool",
        "byte",
        "case",
        "char",
        "else",
        "enum",
        "goto",
        "lock",
        "long",
        "null",
        "this",
        "true",
        "uint",
        "void",
    ],
    // 5 characters
    [
        "break",
        "catch",
        "class",
        "const",
        "event",
        "false",
        "fixed",
        "float",
        "sbyte",
        "short",
        "throw",
        "ulong",
        "using",
        "while",
    ],
    // 6 characters
    [
        "double",
        "extern",
        "object",
        "params",
        "public",
        "return",
        "sealed",
        "sizeof",
        "static",
        "string",
        "struct",
        "switch",
        "typeof",
        "unsafe",
        "ushort",
    ],
    // 7 characters
    [
        "checked",
        "decimal",
        "default",
        "finally",
        "foreach",
        "private",
        "virtual",
    ],
    // 8 characters
    [
        "abstract",
        "continue",
        "delegate",
        "explicit",
        "implicit",
        "internal",
        "operator",
        "override",
        "readonly",
        "volatile",
    ],
    // 9 characters
    [
        "__arglist",
        "__makeref",
        "__reftype",
        "interface",
        "namespace",
        "protected",
        "unchecked",
    ],
    // 10 characters
    [
        "__refvalue",
        "stackalloc",
    ]
];

function IsKeyword(value: string): boolean {
    var isKeyword: boolean = false;
    var listCount: number = keywords.length;

    for (var i = 0; ((i < listCount) && !isKeyword); ++i) {
        var list: string[] = keywords[i];
        var listKeywordCount: number = list.length;

        for (var j = 0; ((j < listKeywordCount) && !isKeyword); ++j) {
            var keyword: string = list[j];

            isKeyword = (value === keyword);
        }
    }

    return isKeyword;
}
*/

function IsValidLanguageIndependentIdentifier(value: string): boolean {
  return IsValidTypeNameOrIdentifier(value, /* isTypeName */ false);
}

const UnicodeCategory = {
  // Uppercase Letter
  Lu: /[A-ZÀ-ÖØ-ÞĀĂĄĆĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬĮİĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŘŚŜŞŠŢŤŦŨŪŬŮŰŲŴŶŸ-ŹŻŽƁ-ƂƄƆ-ƇƉ-ƋƎ-ƑƓ-ƔƖ-ƘƜ-ƝƟ-ƠƢƤƦ-ƧƩƬƮ-ƯƱ-ƳƵƷ-ƸƼǄǇǊǍǏǑǓǕǗǙǛǞǠǢǤǦǨǪǬǮǱǴǶ-ǸǺǼǾȀȂȄȆȈȊȌȎȐȒȔȖȘȚȜȞȠȢȤȦȨȪȬȮȰȲȺ-ȻȽ-ȾɁɃ-ɆɈɊɌɎͰͲͶΆΈ-ΊΌΎ-ΏΑ-ΡΣ-ΫϏϒ-ϔϘϚϜϞϠϢϤϦϨϪϬϮϴϷϹ-ϺϽ-ЯѠѢѤѦѨѪѬѮѰѲѴѶѸѺѼѾҀҊҌҎҐҒҔҖҘҚҜҞҠҢҤҦҨҪҬҮҰҲҴҶҸҺҼҾӀ-ӁӃӅӇӉӋӍӐӒӔӖӘӚӜӞӠӢӤӦӨӪӬӮӰӲӴӶӸӺӼӾԀԂԄԆԈԊԌԎԐԒԔԖԘԚԜԞԠԢԱ-ՖႠ-ჅḀḂḄḆḈḊḌḎḐḒḔḖḘḚḜḞḠḢḤḦḨḪḬḮḰḲḴḶḸḺḼḾṀṂṄṆṈṊṌṎṐṒṔṖṘṚṜṞṠṢṤṦṨṪṬṮṰṲṴṶṸṺṼṾẀẂẄẆẈẊẌẎẐẒẔẞẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸỺỼỾἈ-ἏἘ-ἝἨ-ἯἸ-ἿὈ-ὍὙὛὝὟὨ-ὯᾸ-ΆῈ-ΉῘ-ΊῨ-ῬῸ-Ώℂℇℋ-ℍℐ-ℒℕℙ-ℝℤΩℨK-ℭℰ-ℳℾ-ℿⅅↃⰀ-ⰮⱠⱢ-ⱤⱧⱩⱫⱭ-ⱯⱲⱵⲀⲂⲄⲆⲈⲊⲌⲎⲐⲒⲔⲖⲘⲚⲜⲞⲠⲢⲤⲦⲨⲪⲬⲮⲰⲲⲴⲶⲸⲺⲼⲾⳀⳂⳄⳆⳈⳊⳌⳎⳐⳒⳔⳖⳘⳚⳜⳞⳠⳢꙀꙂꙄꙆꙈꙊꙌꙎꙐꙒꙔꙖꙘꙚꙜꙞꙢꙤꙦꙨꙪꙬꚀꚂꚄꚆꚈꚊꚌꚎꚐꚒꚔꚖꜢꜤꜦꜨꜪꜬꜮꜲꜴꜶꜸꜺꜼꜾꝀꝂꝄꝆꝈꝊꝌꝎꝐꝒꝔꝖꝘꝚꝜꝞꝠꝢꝤꝦꝨꝪꝬꝮꝹꝻꝽ-ꝾꞀꞂꞄꞆꞋＡ-Ｚ]|\ud801[\udc00-\udc27]|\ud835[\udc00-\udc19\udc34-\udc4d\udc68-\udc81\udc9c\udc9e-\udc9f\udca2\udca5-\udca6\udca9-\udcac\udcae-\udcb5\udcd0-\udce9\udd04-\udd05\udd07-\udd0a\udd0d-\udd14\udd16-\udd1c\udd38-\udd39\udd3b-\udd3e\udd40-\udd44\udd46\udd4a-\udd50\udd6c-\udd85\udda0-\uddb9\uddd4-\udded\ude08-\ude21\ude3c-\ude55\ude70-\ude89\udea8-\udec0\udee2-\udefa\udf1c-\udf34\udf56-\udf6e\udf90-\udfa8\udfca]/,
  // Lowercase Letter
  Ll: /[a-zªµºß-öø-ÿāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįıĳĵķ-ĸĺļľŀłńņň-ŉŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷźżž-ƀƃƅƈƌ-ƍƒƕƙ-ƛƞơƣƥƨƪ-ƫƭưƴƶƹ-ƺƽ-ƿǆǉǌǎǐǒǔǖǘǚǜ-ǝǟǡǣǥǧǩǫǭǯ-ǰǳǵǹǻǽǿȁȃȅȇȉȋȍȏȑȓȕȗșțȝȟȡȣȥȧȩȫȭȯȱȳ-ȹȼȿ-ɀɂɇɉɋɍɏ-ʓʕ-ʯͱͳͷͻ-ͽΐά-ώϐ-ϑϕ-ϗϙϛϝϟϡϣϥϧϩϫϭϯ-ϳϵϸϻ-ϼа-џѡѣѥѧѩѫѭѯѱѳѵѷѹѻѽѿҁҋҍҏґғҕҗҙқҝҟҡңҥҧҩҫҭүұҳҵҷҹһҽҿӂӄӆӈӊӌӎ-ӏӑӓӕӗәӛӝӟӡӣӥӧөӫӭӯӱӳӵӷӹӻӽӿԁԃԅԇԉԋԍԏԑԓԕԗԙԛԝԟԡԣա-ևᴀ-ᴫᵢ-ᵷᵹ-ᶚḁḃḅḇḉḋḍḏḑḓḕḗḙḛḝḟḡḣḥḧḩḫḭḯḱḳḵḷḹḻḽḿṁṃṅṇṉṋṍṏṑṓṕṗṙṛṝṟṡṣṥṧṩṫṭṯṱṳṵṷṹṻṽṿẁẃẅẇẉẋẍẏẑẓẕ-ẝẟạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹỻỽỿ-ἇἐ-ἕἠ-ἧἰ-ἷὀ-ὅὐ-ὗὠ-ὧὰ-ώᾀ-ᾇᾐ-ᾗᾠ-ᾧᾰ-ᾴᾶ-ᾷιῂ-ῄῆ-ῇῐ-ΐῖ-ῗῠ-ῧῲ-ῴῶ-ῷⁱⁿℊℎ-ℏℓℯℴℹℼ-ℽⅆ-ⅉⅎↄⰰ-ⱞⱡⱥ-ⱦⱨⱪⱬⱱⱳ-ⱴⱶ-ⱼⲁⲃⲅⲇⲉⲋⲍⲏⲑⲓⲕⲗⲙⲛⲝⲟⲡⲣⲥⲧⲩⲫⲭⲯⲱⲳⲵⲷⲹⲻⲽⲿⳁⳃⳅⳇⳉⳋⳍⳏⳑⳓⳕⳗⳙⳛⳝⳟⳡⳣ-ⳤⴀ-ⴥꙁꙃꙅꙇꙉꙋꙍꙏꙑꙓꙕꙗꙙꙛꙝꙟꙣꙥꙧꙩꙫꙭꚁꚃꚅꚇꚉꚋꚍꚏꚑꚓꚕꚗꜣꜥꜧꜩꜫꜭꜯ-ꜱꜳꜵꜷꜹꜻꜽꜿꝁꝃꝅꝇꝉꝋꝍꝏꝑꝓꝕꝗꝙꝛꝝꝟꝡꝣꝥꝧꝩꝫꝭꝯꝱ-ꝸꝺꝼꝿꞁꞃꞅꞇꞌﬀ-ﬆﬓ-ﬗａ-ｚ]|\ud801[\udc28-\udc4f]|\ud835[\udc1a-\udc33\udc4e-\udc54\udc56-\udc67\udc82-\udc9b\udcb6-\udcb9\udcbb\udcbd-\udcc3\udcc5-\udccf\udcea-\udd03\udd1e-\udd37\udd52-\udd6b\udd86-\udd9f\uddba-\uddd3\uddee-\ude07\ude22-\ude3b\ude56-\ude6f\ude8a-\udea5\udec2-\udeda\udedc-\udee1\udefc-\udf14\udf16-\udf1b\udf36-\udf4e\udf50-\udf55\udf70-\udf88\udf8a-\udf8f\udfaa-\udfc2\udfc4-\udfc9\udfcb]/,
  // Titlecase Letter
  Lt: /[ǅǈǋǲᾈ-ᾏᾘ-ᾟᾨ-ᾯᾼῌῼ]/,
  // Modifier/Number Letter
  Lm: /[ʰ-ˁˆ-ˑˠ-ˤˬˮʹͺՙـۥ-ۦߴ-ߵߺॱๆໆჼៗᡃᱸ-ᱽᴬ-ᵡᵸᶛ-ᶿₐ-ₔⱽⵯⸯ々〱-〵〻ゝ-ゞー-ヾꀕꘌꙿꜗ-ꜟꝰꞈｰﾞ-ﾟ]/,
  // Other Letter
  Lo: /[ƻǀ-ǃʔא-תװ-ײء-ؿف-يٮ-ٯٱ-ۓەۮ-ۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪऄ-हऽॐक़-ॡॲॻ-ॿঅ-ঌএ-ঐও-নপ-রলশ-হঽৎড়-ঢ়য়-ৡৰ-ৱਅ-ਊਏ-ਐਓ-ਨਪ-ਰਲ-ਲ਼ਵ-ਸ਼ਸ-ਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલ-ળવ-હઽૐૠ-ૡଅ-ଌଏ-ଐଓ-ନପ-ରଲ-ଳଵ-ହଽଡ଼-ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கங-சஜஞ-டண-தந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘ-ౙౠ-ౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠ-ೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะา-ำเ-ๅກ-ຂຄງ-ຈຊຍດ-ທນ-ຟມ-ຣລວສ-ຫອ-ະາ-ຳຽເ-ໄໜ-ໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥ-ၦၮ-ၰၵ-ႁႎა-ჺᄀ-ᅙᅟ-ᆢᆨ-ᇹሀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙶᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៜᠠ-ᡂᡄ-ᡷᢀ-ᢨᢪᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦩᧁ-ᧇᨀ-ᨖᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮ-ᮯᰀ-ᰣᱍ-ᱏᱚ-ᱷℵ-ℸⴰ-ⵥⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ〆〼ぁ-ゖゟァ-ヺヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿃ꀀ-ꀔꀖ-ꒌꔀ-ꘋꘐ-ꘟꘪ-ꘫꙮꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꤊ-ꤥꤰ-ꥆꨀ-ꨨꩀ-ꩂꩄ-ꩋ가-힣豈-鶴侮-頻並-龎יִײַ-ﬨשׁ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼｦ-ｯｱ-ﾝﾠ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]|[\ud840-\ud868][\udc00-\udfff]|\ud800[\udc00-\udc0b\udc0d-\udc26\udc28-\udc3a\udc3c-\udc3d\udc3f-\udc4d\udc50-\udc5d\udc80-\udcfa\ude80-\ude9c\udea0-\uded0\udf00-\udf1e\udf30-\udf40\udf42-\udf49\udf80-\udf9d\udfa0-\udfc3\udfc8-\udfcf]|\ud801[\udc50-\udc9d]|\ud802[\udc00-\udc05\udc08\udc0a-\udc35\udc37-\udc38\udc3c\udc3f\udd00-\udd15\udd20-\udd39\ude00\ude10-\ude13\ude15-\ude17\ude19-\ude33]|\ud808[\udc00-\udf6e]|\ud869[\udc00-\uded6]|\ud87e[\udc00-\ude1d]/,
  // Non Spacing Mark
  Mn: /[\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1-\u05c2\u05c4-\u05c5\u05c7\u0610-\u061a\u064b-\u065e\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7-\u06e8\u06ea-\u06ed\u0711\u0730-\u074a\u07a6-\u07b0\u07eb-\u07f3\u0901-\u0902\u093c\u0941-\u0948\u094d\u0951-\u0954\u0962-\u0963\u0981\u09bc\u09c1-\u09c4\u09cd\u09e2-\u09e3\u0a01-\u0a02\u0a3c\u0a41-\u0a42\u0a47-\u0a48\u0a4b-\u0a4d\u0a51\u0a70-\u0a71\u0a75\u0a81-\u0a82\u0abc\u0ac1-\u0ac5\u0ac7-\u0ac8\u0acd\u0ae2-\u0ae3\u0b01\u0b3c\u0b3f\u0b41-\u0b44\u0b4d\u0b56\u0b62-\u0b63\u0b82\u0bc0\u0bcd\u0c3e-\u0c40\u0c46-\u0c48\u0c4a-\u0c4d\u0c55-\u0c56\u0c62-\u0c63\u0cbc\u0cbf\u0cc6\u0ccc-\u0ccd\u0ce2-\u0ce3\u0d41-\u0d44\u0d4d\u0d62-\u0d63\u0dca\u0dd2-\u0dd4\u0dd6\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0eb1\u0eb4-\u0eb9\u0ebb-\u0ebc\u0ec8-\u0ecd\u0f18-\u0f19\u0f35\u0f37\u0f39\u0f71-\u0f7e\u0f80-\u0f84\u0f86-\u0f87\u0f90-\u0f97\u0f99-\u0fbc\u0fc6\u102d-\u1030\u1032-\u1037\u1039-\u103a\u103d-\u103e\u1058-\u1059\u105e-\u1060\u1071-\u1074\u1082\u1085-\u1086\u108d\u135f\u1712-\u1714\u1732-\u1734\u1752-\u1753\u1772-\u1773\u17b7-\u17bd\u17c6\u17c9-\u17d3\u17dd\u180b-\u180d\u18a9\u1920-\u1922\u1927-\u1928\u1932\u1939-\u193b\u1a17-\u1a18\u1b00-\u1b03\u1b34\u1b36-\u1b3a\u1b3c\u1b42\u1b6b-\u1b73\u1b80-\u1b81\u1ba2-\u1ba5\u1ba8-\u1ba9\u1c2c-\u1c33\u1c36-\u1c37\u1dc0-\u1de6\u1dfe-\u1dff\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2de0-\u2dff\u302a-\u302f\u3099-\u309a\ua66f\ua67c-\ua67d\ua802\ua806\ua80b\ua825-\ua826\ua8c4\ua926-\ua92d\ua947-\ua951\uaa29-\uaa2e\uaa31-\uaa32\uaa35-\uaa36\uaa43\uaa4c\ufb1e\ufe00-\ufe0f\ufe20-\ufe26]|\ud800\uddfd|\ud802[\ude01-\ude03\ude05-\ude06\ude0c-\ude0f\ude38-\ude3a\ude3f]|\ud834[\udd67-\udd69\udd7b-\udd82\udd85-\udd8b\uddaa-\uddad\ude42-\ude44]|\udb40[\udd00-\uddef]/,
  // Spacing Combining Mark
  // eslint-disable-next-line no-misleading-character-class
  Mc: /[\u0903\u093e-\u0940\u0949-\u094c\u0982-\u0983\u09be-\u09c0\u09c7-\u09c8\u09cb-\u09cc\u09d7\u0a03\u0a3e-\u0a40\u0a83\u0abe-\u0ac0\u0ac9\u0acb-\u0acc\u0b02-\u0b03\u0b3e\u0b40\u0b47-\u0b48\u0b4b-\u0b4c\u0b57\u0bbe-\u0bbf\u0bc1-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcc\u0bd7\u0c01-\u0c03\u0c41-\u0c44\u0c82-\u0c83\u0cbe\u0cc0-\u0cc4\u0cc7-\u0cc8\u0cca-\u0ccb\u0cd5-\u0cd6\u0d02-\u0d03\u0d3e-\u0d40\u0d46-\u0d48\u0d4a-\u0d4c\u0d57\u0d82-\u0d83\u0dcf-\u0dd1\u0dd8-\u0ddf\u0df2-\u0df3\u0f3e-\u0f3f\u0f7f\u102b-\u102c\u1031\u1038\u103b-\u103c\u1056-\u1057\u1062-\u1064\u1067-\u106d\u1083-\u1084\u1087-\u108c\u108f\u17b6\u17be-\u17c5\u17c7-\u17c8\u1923-\u1926\u1929-\u192b\u1930-\u1931\u1933-\u1938\u19b0-\u19c0\u19c8-\u19c9\u1a19-\u1a1b\u1b04\u1b35\u1b3b\u1b3d-\u1b41\u1b43-\u1b44\u1b82\u1ba1\u1ba6-\u1ba7\u1baa\u1c24-\u1c2b\u1c34-\u1c35\ua823-\ua824\ua827\ua880-\ua881\ua8b4-\ua8c3\ua952-\ua953\uaa2f-\uaa30\uaa33-\uaa34\uaa4d]|\ud834[\udd65-\udd66\udd6d-\udd72]/,
  // Connector Punctuation
  Pc: /[_‿-⁀⁔︳-︴﹍-﹏＿]/,
  // Decimal Digit Number
  Nd: /[0-9٠-٩۰-۹߀-߉०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯๐-๙໐-໙༠-༩၀-၉႐-႙០-៩᠐-᠙᥆-᥏᧐-᧙᭐-᭙᮰-᮹᱀-᱉᱐-᱙꘠-꘩꣐-꣙꤀-꤉꩐-꩙０-９]|\ud801[\udca0-\udca9]|\ud835[\udfce-\udfff]/,
};

function IsValidTypeNameOrIdentifier(value: string, isTypeName: boolean): boolean {
  let nextMustBeStartChar = true;

  if (!value.length) {
    return false;
  }

  // each char must be Lu, Ll, Lt, Lm, Lo, Nd, Mn, Mc, Pc
  for (let i = 0; i < value.length; i++) {
    const ch: string = value[i];

    if (
      UnicodeCategory.Lu.test(ch) ||
      UnicodeCategory.Ll.test(ch) ||
      UnicodeCategory.Lt.test(ch) ||
      UnicodeCategory.Lm.test(ch) ||
      UnicodeCategory.Lo.test(ch)
    ) {
      nextMustBeStartChar = false;
    } else if (
      UnicodeCategory.Mn.test(ch) ||
      UnicodeCategory.Mc.test(ch) ||
      UnicodeCategory.Pc.test(ch) ||
      UnicodeCategory.Nd.test(ch)
    ) {
      // Underscore is a valid starting character, even though it is a ConnectorPunctuation.
      if (nextMustBeStartChar && ch !== "_") {
        return false;
      }

      nextMustBeStartChar = false;
    } else {
      // We only check the special Type chars for type names.
      if (!isTypeName) {
        return false;
      } else {
        const ref: { nextMustBeStartChar: boolean } = { nextMustBeStartChar: nextMustBeStartChar };
        const isSpecialTypeChar = IsSpecialTypeChar(ch, ref);

        nextMustBeStartChar = ref.nextMustBeStartChar;

        if (!isSpecialTypeChar) {
          return false;
        }
      }
    }
  }

  return true;
}

// This can be a special character like a separator that shows up in a type name
// This is an odd set of characters.  Some come from characters that are allowed by C++, like < and >.
// Others are characters that are specified in the type and assembly name grammer.
function IsSpecialTypeChar(ch: string, ref: { nextMustBeStartChar: boolean }): boolean {
  switch (ch) {
    case ":":
    case ".":
    case "$":
    case "+":
    case "<":
    case ">":
    case "-":
    case "[":
    case "]":
    case ",":
    case "&":
    case "*":
      ref.nextMustBeStartChar = true;
      return true;
    case "`":
      return true;
  }
  return false;
}
