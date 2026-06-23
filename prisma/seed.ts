import {
  ListingStatus,
  OrderStatus,
  PaymentProofStatus,
  PrismaClient,
  TradeRiskStatus,
  UserRole,
  VariantSelectionMode
} from "@prisma/client";
import { hashPassword, normalizeEmail, normalizeMalaysianPhone } from "../lib/security-core";

const prisma = new PrismaClient();

const categories = [
  ["mobile-games", "手机游戏", "Mobile Games", "Permainan Mudah Alih"],
  ["pc-online", "PC线上游戏", "PC Online Games", "Permainan PC Dalam Talian"],
  ["steam-games", "Steam游戏", "Steam Games", "Permainan Steam"],
  ["web-games", "网页游戏", "Web Games", "Permainan Web"],
  ["point-cards", "点数卡", "Point Cards", "Kad Mata"],
  ["overseas-recharge", "海外卡/充值", "Overseas Recharge", "Tambah Nilai Luar Negara"],
  ["digital-services", "非游戏数字服务", "Digital Services", "Perkhidmatan Digital"]
] as const;

type VariantSeed = {
  slug: string;
  label: string;
  platform?: string;
  loginChannel?: string;
  regionLabel?: string;
  compatibilityNote?: string;
};

type GameSeed = {
  slug: string;
  name: string;
  category: string;
  poster: string;
  platform: string;
  loginChannel: string;
  region: string;
  heat: number;
  description: string;
  selectionMode?: VariantSelectionMode;
  isService?: boolean;
  variants?: VariantSeed[];
  productCodes: string[];
};

const regionVariants = (regions: string[]): VariantSeed[] => regions.map((regionLabel) => ({
  slug: regionLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  label: regionLabel,
  regionLabel,
  compatibilityNote: `商品仅适用于 ${regionLabel} 服务器，下单前请核对游戏内服务器。`
}));

const platformLoginVariants: VariantSeed[] = [
  { slug: "ios-wechat", label: "iOS · 微信区", platform: "iOS", loginChannel: "微信", regionLabel: "中国区", compatibilityNote: "仅适用于 iOS 微信区，不能转移至 QQ 或 Android 区。" },
  { slug: "ios-qq", label: "iOS · QQ区", platform: "iOS", loginChannel: "QQ", regionLabel: "中国区", compatibilityNote: "仅适用于 iOS QQ区，不能转移至微信或 Android 区。" },
  { slug: "android-wechat", label: "Android · 微信区", platform: "Android", loginChannel: "微信", regionLabel: "中国区", compatibilityNote: "仅适用于 Android 微信区，不能转移至 QQ 或 iOS 区。" },
  { slug: "android-qq", label: "Android · QQ区", platform: "Android", loginChannel: "QQ", regionLabel: "中国区", compatibilityNote: "仅适用于 Android QQ区，不能转移至微信或 iOS 区。" }
];

const games: GameSeed[] = [
  { slug: "mobile-legends", name: "Mobile Legends: Bang Bang", category: "mobile-games", poster: "mobile-legends-ai.jpg", platform: "iOS / Android", loginChannel: "Moonton", region: "Malaysia", heat: 68240, description: "马来西亚热门 MOBA 市场，支持账号、钻石代储与陪练服务。", productCodes: ["ACCOUNT", "TOPUP", "BOOSTING", "REQUEST"] },
  { slug: "pubg-mobile", name: "PUBG Mobile", category: "mobile-games", poster: "pubg-mobile-ai.jpg", platform: "iOS / Android", loginChannel: "Level Infinite", region: "SEA / Global", heat: 42110, description: "账号、UC 代储、套装与陪练市场。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["SEA", "Global", "KR / JP"]), productCodes: ["ACCOUNT", "TOPUP", "ITEM", "BOOSTING"] },
  { slug: "genshin-impact", name: "原神 Genshin Impact", category: "mobile-games", poster: "genshin-impact-ai.jpg", platform: "iOS / Android / PC", loginChannel: "HoYoverse", region: "Global", heat: 79480, description: "按服务器筛选账号、创世结晶代储、材料与陪练。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Asia", "America", "Europe", "TW / HK / MO"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING", "REQUEST"] },
  { slug: "honkai-star-rail", name: "崩坏：星穹铁道", category: "mobile-games", poster: "honkai-star-rail-ai.jpg", platform: "iOS / Android / PC", loginChannel: "HoYoverse", region: "Global", heat: 66520, description: "星琼代储、开拓账号与养成服务。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Asia", "America", "Europe", "TW / HK / MO"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "zenless-zone-zero", name: "绝区零 Zenless Zone Zero", category: "mobile-games", poster: "zenless-zone-zero-ai.jpg", platform: "iOS / Android / PC", loginChannel: "HoYoverse", region: "Global", heat: 60380, description: "绳网账号、菲林代储与角色养成服务。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Asia", "America", "Europe", "TW / HK / MO"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "honkai-impact-3rd", name: "崩坏3 Honkai Impact 3rd", category: "mobile-games", poster: "honkai-impact-3rd-ai.jpg", platform: "iOS / Android / PC", loginChannel: "HoYoverse", region: "SEA / Global", heat: 37420, description: "舰长账号、水晶代储与深渊养成服务。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Southeast Asia", "Global", "China"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "tears-of-themis", name: "未定事件簿 Tears of Themis", category: "mobile-games", poster: "tears-of-themis-ai.jpg", platform: "iOS / Android", loginChannel: "HoYoverse", region: "Global", heat: 22840, description: "律师账号、晶片代储与活动代肝服务。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Global", "TW / HK / MO"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "honkai-gakuen-2", name: "崩坏学园2", category: "mobile-games", poster: "honkai-gakuen-2-ai.jpg", platform: "iOS / Android", loginChannel: "miHoYo", region: "China", heat: 16420, description: "中国区账号与活动代肝专区。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["China"]), productCodes: ["ACCOUNT", "BOOSTING"] },
  { slug: "wuthering-waves", name: "鸣潮 Wuthering Waves", category: "mobile-games", poster: "wuthering-waves-ai.jpg", platform: "iOS / Android / PC", loginChannel: "Kuro Games", region: "Global", heat: 57940, description: "漂泊者账号、月相代储与声骸养成服务。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Southeast Asia", "Asia", "HMT", "America", "Europe"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "honor-of-kings", name: "王者荣耀 Honor of Kings", category: "mobile-games", poster: "honor-of-kings-ai.jpg", platform: "iOS / Android", loginChannel: "微信 / QQ", region: "中国区", heat: 82400, description: "进入市场后选择手机平台与登录渠道，避免买错区服。", selectionMode: VariantSelectionMode.PLATFORM_LOGIN, variants: platformLoginVariants, productCodes: ["ACCOUNT", "TOPUP", "BOOSTING", "GIFT"] },
  { slug: "peace-elite", name: "和平精英 Peace Elite", category: "mobile-games", poster: "peace-elite-ai.jpg", platform: "iOS / Android", loginChannel: "微信 / QQ", region: "中国区", heat: 71100, description: "按 iOS、Android、微信与 QQ 精确筛选账号和点券服务。", selectionMode: VariantSelectionMode.PLATFORM_LOGIN, variants: platformLoginVariants, productCodes: ["ACCOUNT", "TOPUP", "ITEM", "BOOSTING"] },
  { slug: "valorant-mobile", name: "无畏契约：源能行动（手游）", category: "mobile-games", poster: "valorant-mobile-ai.jpg", platform: "iOS / Android", loginChannel: "腾讯 / Riot", region: "中国区", heat: 64800, description: "手游账号、点券与陪练市场。", selectionMode: VariantSelectionMode.PLATFORM, variants: [{ slug: "ios", label: "iOS", platform: "iOS" }, { slug: "android", label: "Android", platform: "Android" }], productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "free-fire", name: "Free Fire", category: "mobile-games", poster: "free-fire-ai.jpg", platform: "iOS / Android", loginChannel: "Garena", region: "SEA", heat: 61420, description: "Garena 账号、钻石代储与游戏道具市场。", productCodes: ["ACCOUNT", "TOPUP", "ITEM", "BOOSTING"] },
  { slug: "call-of-duty-mobile", name: "Call of Duty: Mobile", category: "mobile-games", poster: "call-of-duty-mobile-ai.jpg", platform: "iOS / Android", loginChannel: "Garena / Activision", region: "SEA / Global", heat: 53840, description: "Garena 与 Global 版本分别筛选，支持 CP 与陪练。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Garena SEA", "Global"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "wild-rift", name: "英雄联盟手游 Wild Rift", category: "mobile-games", poster: "wild-rift-ai.jpg", platform: "iOS / Android", loginChannel: "Riot", region: "SEA", heat: 48760, description: "手游账号、峡谷币代储与排位陪练。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Southeast Asia", "China"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "arena-breakout", name: "暗区突围 Arena Breakout", category: "mobile-games", poster: "arena-breakout-ai.jpg", platform: "iOS / Android", loginChannel: "Level Infinite", region: "Global / China", heat: 45620, description: "账号、柯恩币、装备与陪练服务。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Global", "China"]), productCodes: ["ACCOUNT", "CURRENCY", "ITEM", "BOOSTING"] },
  { slug: "delta-force", name: "三角洲行动 Delta Force", category: "mobile-games", poster: "delta-force-ai.jpg", platform: "PC / Mobile", loginChannel: "Level Infinite", region: "Global / China", heat: 58640, description: "干员账号、点券、道具与组队陪练。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Global", "China"]), productCodes: ["ACCOUNT", "TOPUP", "ITEM", "BOOSTING"] },
  { slug: "roblox", name: "Roblox", category: "web-games", poster: "roblox-ai.jpg", platform: "PC / Mobile", loginChannel: "Roblox", region: "Global", heat: 51200, description: "Robux、礼品卡与体验内道具服务。", productCodes: ["TOPUP", "GIFT_CARD", "ITEM"] },
  { slug: "ragnarok-online", name: "Ragnarok Online", category: "pc-online", poster: "ragnarok-online-ai.jpg", platform: "PC / Mobile", loginChannel: "Game account", region: "SEA / Global", heat: 24800, description: "多版本仙境传说账号、货币与装备市场。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Southeast Asia", "Global"]), productCodes: ["ACCOUNT", "CURRENCY", "ITEM", "BOOSTING"] },
  { slug: "valorant", name: "VALORANT", category: "pc-online", poster: "valorant-ai.jpg", platform: "PC", loginChannel: "Riot", region: "APAC", heat: 79210, description: "Riot 账号、VP 代储与竞技陪练。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["AP", "NA", "EU", "KR"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "league-of-legends", name: "英雄联盟 League of Legends", category: "pc-online", poster: "league-of-legends-ai.jpg", platform: "PC", loginChannel: "Riot", region: "SEA / Global", heat: 74820, description: "召唤师账号、点券与排位陪练市场。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["SG / MY / ID", "PH", "TH", "VN", "TW / HK / MO", "NA / EU"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "teamfight-tactics", name: "云顶之弈 Teamfight Tactics", category: "pc-online", poster: "teamfight-tactics-ai.jpg", platform: "PC / Mobile", loginChannel: "Riot", region: "SEA / Global", heat: 49320, description: "TFT 账号、代币与排位服务。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["SG / MY / ID", "Global", "China"]), productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "counter-strike-2", name: "Counter-Strike 2", category: "steam-games", poster: "counter-strike-2-ai.jpg", platform: "PC / Steam", loginChannel: "Steam", region: "Global", heat: 81640, description: "饰品、库存估价与竞技陪练专区。", productCodes: ["ITEM", "BOOSTING", "REQUEST"] },
  { slug: "dota-2", name: "Dota 2", category: "steam-games", poster: "dota-2-ai.jpg", platform: "PC / Steam", loginChannel: "Steam", region: "Global", heat: 55720, description: "饰品、宝瓶、账号与天梯陪练。", productCodes: ["ACCOUNT", "ITEM", "BOOSTING"] },
  { slug: "fortnite", name: "Fortnite", category: "pc-online", poster: "fortnite-ai.jpg", platform: "PC / Xbox", loginChannel: "Epic Games", region: "Global", heat: 69640, description: "V-Bucks、礼物与组队服务。", productCodes: ["TOPUP", "GIFT", "BOOSTING"] },
  { slug: "gta-online", name: "GTA Online", category: "pc-online", poster: "gta-online-ai.jpg", platform: "PC / Xbox", loginChannel: "Rockstar", region: "Global", heat: 53210, description: "PC 与 Xbox 账号、游戏币与任务服务。", selectionMode: VariantSelectionMode.PLATFORM, variants: [{ slug: "pc", label: "PC", platform: "PC" }, { slug: "xbox", label: "Xbox", platform: "Xbox" }], productCodes: ["ACCOUNT", "CURRENCY", "BOOSTING"] },
  { slug: "marvel-rivals", name: "Marvel Rivals", category: "pc-online", poster: "marvel-rivals-ai.jpg", platform: "PC / Xbox", loginChannel: "NetEase", region: "Global", heat: 62180, description: "账号、Lattice 代储与竞技陪练。", productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "world-of-warcraft", name: "World of Warcraft", category: "pc-online", poster: "world-of-warcraft-ai.jpg", platform: "PC", loginChannel: "Battle.net", region: "Global", heat: 46980, description: "金币、装备、团队副本与角色服务。", selectionMode: VariantSelectionMode.REGION, variants: regionVariants(["Americas / Oceania", "Europe", "Asia"]), productCodes: ["CURRENCY", "ITEM", "BOOSTING"] },
  { slug: "ea-sports-fc", name: "EA Sports FC", category: "pc-online", poster: "ea-sports-fc-ai.jpg", platform: "PC / Xbox", loginChannel: "EA", region: "Global", heat: 57360, description: "Ultimate Team 金币、球员与代练服务。", selectionMode: VariantSelectionMode.PLATFORM, variants: [{ slug: "pc", label: "PC", platform: "PC" }, { slug: "xbox", label: "Xbox", platform: "Xbox" }], productCodes: ["CURRENCY", "ITEM", "BOOSTING"] },
  { slug: "efootball", name: "eFootball", category: "mobile-games", poster: "efootball-ai.jpg", platform: "PC / Mobile / Xbox", loginChannel: "KONAMI", region: "Global", heat: 51680, description: "金币、球员阵容与活动代肝服务。", selectionMode: VariantSelectionMode.PLATFORM, variants: [{ slug: "mobile", label: "iOS / Android", platform: "Mobile" }, { slug: "pc", label: "PC", platform: "PC" }, { slug: "xbox", label: "Xbox", platform: "Xbox" }], productCodes: ["ACCOUNT", "TOPUP", "BOOSTING"] },
  { slug: "forza-horizon", name: "Forza Horizon", category: "steam-games", poster: "forza-horizon-ai.jpg", platform: "PC / Xbox", loginChannel: "Microsoft", region: "Global", heat: 22420, description: "车辆、游戏币与进度服务。", selectionMode: VariantSelectionMode.PLATFORM, variants: [{ slug: "pc", label: "PC", platform: "PC" }, { slug: "xbox", label: "Xbox", platform: "Xbox" }], productCodes: ["CURRENCY", "ITEM", "BOOSTING"] },
  { slug: "steam-wallet-my", name: "Steam Wallet MY", category: "steam-games", poster: "steam-wallet-ai.jpg", platform: "Steam", loginChannel: "Wallet", region: "Malaysia", heat: 61080, description: "马来西亚 Steam 钱包码与数字礼品服务。", isService: true, productCodes: ["GIFT_CARD", "REQUEST"] },
  { slug: "garena-shells", name: "Garena Shells", category: "point-cards", poster: "garena-shells-ai.jpg", platform: "Top-up", loginChannel: "Garena", region: "Malaysia", heat: 44950, description: "Garena Shells 点数与本地充值服务。", isService: true, productCodes: ["TOPUP", "GIFT_CARD"] },
  { slug: "unipin-malaysia", name: "UniPin Malaysia", category: "point-cards", poster: "unipin-ai.jpg", platform: "Top-up", loginChannel: "UniPin", region: "Malaysia", heat: 38800, description: "UniPin 点数与合作游戏充值。", isService: true, productCodes: ["TOPUP", "GIFT_CARD"] },
  { slug: "netease-overseas-topup", name: "NetEase Overseas Top-up", category: "overseas-recharge", poster: "netease-recharge-ai.jpg", platform: "Top-up", loginChannel: "NetEase", region: "Global", heat: 31320, description: "网易海外游戏充值与地区核对服务。", isService: true, productCodes: ["TOPUP", "REQUEST"] },
  { slug: "discord-nitro", name: "Discord Nitro", category: "digital-services", poster: "discord-nitro-ai.jpg", platform: "Digital", loginChannel: "Discord", region: "Global", heat: 28040, description: "Nitro 订阅与礼物链接服务。", isService: true, productCodes: ["SUBSCRIPTION", "GIFT"] }
];

const productTypes = {
  ACCOUNT: ["账号", "Account", "Akaun", TradeRiskStatus.REVIEW_REQUIRED],
  CURRENCY: ["游戏币", "Currency", "Mata Wang", TradeRiskStatus.NORMAL],
  ITEM: ["道具", "Item", "Item", TradeRiskStatus.NORMAL],
  TOPUP: ["代储/充值", "Top-up", "Tambah Nilai", TradeRiskStatus.NORMAL],
  BOOSTING: ["代练", "Boosting", "Khidmat Naik Taraf", TradeRiskStatus.NORMAL],
  GIFT: ["送礼", "Gifting", "Hadiah", TradeRiskStatus.NORMAL],
  GIFT_CARD: ["点数卡", "Gift Card", "Kad Hadiah", TradeRiskStatus.NORMAL],
  SUBSCRIPTION: ["订阅", "Subscription", "Langganan", TradeRiskStatus.NORMAL],
  REQUEST: ["收购需求", "Purchase Request", "Permintaan Beli", TradeRiskStatus.NORMAL]
} as const;

const legacyVariants = [
  ["honor-kings-ios-wechat", "honor-of-kings", "ios-wechat"],
  ["honor-kings-ios-qq", "honor-of-kings", "ios-qq"],
  ["honor-kings-android-wechat", "honor-of-kings", "android-wechat"],
  ["honor-kings-android-qq", "honor-of-kings", "android-qq"],
  ["peace-elite-ios-wechat", "peace-elite", "ios-wechat"],
  ["peace-elite-ios-qq", "peace-elite", "ios-qq"],
  ["peace-elite-android-wechat", "peace-elite", "android-wechat"],
  ["peace-elite-android-qq", "peace-elite", "android-qq"]
] as const;

const demoListings = [
  { game: "honor-of-kings", variant: "ios-wechat", type: "ACCOUNT", title: "荣耀典藏皮肤账号 · iOS 微信区", description: "已完成资料核对，包含多款限定皮肤。交付前会在订单房再次确认区服，账号类商品由管理员人工审核。", price: 288, stock: 1, deliveryMins: 25, tags: ["iOS", "微信区", "人工审核"] },
  { game: "honor-of-kings", variant: "android-qq", type: "TOPUP", title: "王者点券代储 · Android QQ区", description: "下单后提供游戏角色资料，卖家在平台确认付款后开始代储。", price: 42, stock: 20, deliveryMins: 15, tags: ["Android", "QQ区", "快速交付"] },
  { game: "peace-elite", variant: "ios-wechat", type: "ACCOUNT", title: "和平精英收藏账号 · iOS 微信区", description: "展示资料与库存已提交平台审核，购买前请确认 iOS 微信区兼容。", price: 368, stock: 1, deliveryMins: 30, tags: ["iOS", "微信区", "收藏账号"] },
  { game: "genshin-impact", variant: "asia", type: "TOPUP", title: "原神创世结晶代储 · 亚洲服", description: "亚洲服务器快速代储，不索取密码。订单内核对 UID 与服务器。", price: 35.9, stock: 50, deliveryMins: 10, tags: ["亚洲服", "无需密码", "热卖"] },
  { game: "genshin-impact", variant: "asia", type: "ACCOUNT", title: "原神成品账号 · 亚洲服", description: "角色与武器资料已截图留证，交付后请立即完成安全资料变更。", price: 258, stock: 1, deliveryMins: 25, tags: ["亚洲服", "成品账号", "人工审核"] },
  { game: "honkai-star-rail", variant: "asia", type: "TOPUP", title: "崩铁星琼代储 · 亚洲服", description: "亚洲服星琼代储服务，付款确认后平均 12 分钟完成。", price: 32.9, stock: 40, deliveryMins: 12, tags: ["亚洲服", "星琼", "快速交付"] },
  { game: "zenless-zone-zero", variant: "asia", type: "ACCOUNT", title: "绝区零代理人成品号 · 亚洲服", description: "角色阵容与资源明细在交付证据中展示，账号交易需确认发行商条款风险。", price: 188, stock: 1, deliveryMins: 30, tags: ["亚洲服", "成品账号"] },
  { game: "wuthering-waves", variant: "southeast-asia", type: "TOPUP", title: "鸣潮月相代储 · 东南亚服", description: "东南亚服务器月相代储，订单内提交 UID 即可。", price: 25.9, stock: 30, deliveryMins: 12, tags: ["SEA", "月相", "无需密码"] },
  { game: "mobile-legends", type: "TOPUP", title: "MLBB 钻石代储 · Malaysia", description: "马来西亚区钻石代储，适合常用面额，付款确认后开始处理。", price: 18.9, stock: 80, deliveryMins: 8, tags: ["Malaysia", "钻石", "畅销"] },
  { game: "pubg-mobile", variant: "sea", type: "ACCOUNT", title: "PUBG Mobile 赛季收藏账号 · SEA", description: "东南亚区账号，皮肤与赛季资料已留证，平台人工审核后上架。", price: 168, stock: 1, deliveryMins: 25, tags: ["SEA", "收藏账号"] },
  { game: "free-fire", type: "TOPUP", title: "Free Fire 钻石充值 · SEA", description: "Garena SEA 区充值，提交玩家 ID 后快速完成。", price: 12.9, stock: 100, deliveryMins: 8, tags: ["SEA", "Garena", "快速"] },
  { game: "valorant", variant: "ap", type: "ACCOUNT", title: "VALORANT AP 皮肤账号", description: "AP 区 Riot 账号，库存与段位资料已提交审核，购买前请阅读账号交易风险。", price: 228, stock: 1, deliveryMins: 20, tags: ["AP", "Riot", "人工审核"] },
  { game: "league-of-legends", variant: "sg-my-id", type: "BOOSTING", title: "英雄联盟排位陪练 · SG/MY/ID", description: "按局或时段提供陪练，沟通、排期与完成证据全部保留在订单房。", price: 45, stock: 12, deliveryMins: 60, tags: ["SG/MY/ID", "排位", "陪练"] },
  { game: "counter-strike-2", type: "ITEM", title: "CS2 饰品交易 · 平台验货", description: "下单后在订单房确认 Steam 交易资料，避免私下链接与冒充报价。", price: 75, stock: 3, deliveryMins: 20, tags: ["Steam", "饰品", "证据留存"] },
  { game: "fortnite", type: "GIFT", title: "Fortnite 商店礼物服务", description: "添加好友并满足游戏礼物规则后交付，具体等待时间会在订单内说明。", price: 29, stock: 15, deliveryMins: 60, tags: ["Global", "礼物"] },
  { game: "steam-wallet-my", type: "GIFT_CARD", title: "Steam Wallet MY RM50", description: "马来西亚区 Steam Wallet 数字码，管理员确认付款后在订单房交付。", price: 50, stock: 25, deliveryMins: 5, tags: ["Malaysia", "RM50", "数字码"] }
] as const;

async function seedDemoMarketplace() {
  if (process.env.SEED_DEMO_DATA !== "true" || process.env.NODE_ENV === "production") return;

  const [sellerPassword, buyerPassword, adminPassword] = await Promise.all([
    hashPassword("DemoSeller2026"),
    hashPassword("DemoBuyer2026"),
    hashPassword("DemoAdmin2026")
  ]);
  const seller = await prisma.user.upsert({
    where: { emailNormalized: "demo-seller@gametrade.my" },
    create: { role: UserRole.SELLER, name: "Aiman", email: "demo-seller@gametrade.my", emailNormalized: "demo-seller@gametrade.my", passwordHash: sellerPassword, emailVerified: true, primaryVerification: "EMAIL", realNameVerified: true },
    update: { role: UserRole.SELLER, emailVerified: true, banned: false, realNameVerified: true }
  });
  const buyer = await prisma.user.upsert({
    where: { emailNormalized: "demo-buyer@gametrade.my" },
    create: { name: "Mei Ling", email: "demo-buyer@gametrade.my", emailNormalized: "demo-buyer@gametrade.my", passwordHash: buyerPassword, emailVerified: true, primaryVerification: "EMAIL" },
    update: { emailVerified: true, banned: false }
  });
  await prisma.user.upsert({
    where: { emailNormalized: "demo-admin@gametrade.my" },
    create: { role: UserRole.ADMIN, name: "Demo Admin", email: "demo-admin@gametrade.my", emailNormalized: "demo-admin@gametrade.my", passwordHash: adminPassword, emailVerified: true, primaryVerification: "EMAIL", realNameVerified: true },
    update: { role: UserRole.ADMIN, emailVerified: true, banned: false }
  });
  await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    create: { userId: seller.id, shopName: "MY Game Hub", rating: 4.92, completedOrders: 842, guaranteeDeposit: 2000, responseMins: 6, onTimeRate: 98.6, disputeRate: 0.8, trustGrade: "A" },
    update: { shopName: "MY Game Hub", rating: 4.92, completedOrders: 842, guaranteeDeposit: 2000, responseMins: 6, onTimeRate: 98.6, disputeRate: 0.8, trustGrade: "A" }
  });

  const listingIds: string[] = [];
  for (const item of demoListings) {
    const game = await prisma.game.findUniqueOrThrow({ where: { slug: item.game } });
    const variantSlug = "variant" in item ? item.variant : null;
    const variant = variantSlug ? await prisma.gameVariant.findUnique({ where: { gameId_slug: { gameId: game.id, slug: variantSlug } } }) : null;
    const existing = await prisma.listing.findFirst({ where: { sellerId: seller.id, title: item.title } });
    const data = { gameId: game.id, gameVariantId: variant?.id ?? null, sellerId: seller.id, type: item.type, title: item.title, description: item.description, price: item.price, stock: item.stock, deliveryMins: item.deliveryMins, status: ListingStatus.ACTIVE, riskStatus: item.type === "ACCOUNT" ? TradeRiskStatus.REVIEW_REQUIRED : TradeRiskStatus.NORMAL, termsRiskAcknowledged: item.type === "ACCOUNT", tags: [...item.tags], reviewedAt: new Date() };
    const listing = existing ? await prisma.listing.update({ where: { id: existing.id }, data }) : await prisma.listing.create({ data });
    listingIds.push(listing.id);
  }

  const safeRoomOrder = await prisma.order.upsert({
    where: { clientRequestId: "demo-safe-room-v1" },
    create: { clientRequestId: "demo-safe-room-v1", listingId: listingIds[0], buyerId: buyer.id, sellerId: seller.id, status: OrderStatus.DELIVERED, amount: 288, fee: 14.4, paymentMethod: "DUITNOW_QR", paymentApprovedAt: new Date(Date.now() - 90 * 60 * 1000), deliveredAt: new Date(Date.now() - 20 * 60 * 1000), expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000), deliverySecret: "演示交付资料：请在真实业务中使用加密存储。" },
    update: { listingId: listingIds[0], buyerId: buyer.id, sellerId: seller.id, status: OrderStatus.DELIVERED, amount: 288, fee: 14.4, paymentMethod: "DUITNOW_QR", expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000) }
  });
  await prisma.paymentProof.upsert({
    where: { id: "demo-payment-proof" },
    create: { id: "demo-payment-proof", orderId: safeRoomOrder.id, method: "DUITNOW_QR", reference: "DN-DEMO-2026", status: PaymentProofStatus.APPROVED, note: "演示付款凭证已由管理员确认" },
    update: { orderId: safeRoomOrder.id, status: PaymentProofStatus.APPROVED }
  });
  await prisma.message.deleteMany({ where: { orderId: safeRoomOrder.id } });
  await prisma.message.createMany({ data: [
    { orderId: safeRoomOrder.id, senderId: buyer.id, body: "你好，我已确认是 iOS 微信区。" },
    { orderId: safeRoomOrder.id, senderId: seller.id, body: "收到，付款审核通过后我会在订单内交付。" },
    { orderId: safeRoomOrder.id, senderId: seller.id, body: "交付资料已提交，请在倒计时结束前检查并验收。" }
  ] });
}

async function main() {
  for (const [slug, nameZh, nameEn, nameMs] of categories) {
    await prisma.gameCategory.upsert({
      where: { slug },
      create: { slug, nameZh, nameEn, nameMs },
      update: { nameZh, nameEn, nameMs }
    });
  }

  for (const gameSeed of games) {
    const category = await prisma.gameCategory.findUniqueOrThrow({ where: { slug: gameSeed.category } });
    const game = await prisma.game.upsert({
      where: { slug: gameSeed.slug },
      create: {
        slug: gameSeed.slug,
        name: gameSeed.name,
        categoryId: category.id,
        posterUrl: `/assets/game-posters/${gameSeed.poster}`,
        posterSource: "AI-generated original marketplace artwork",
        platform: gameSeed.platform,
        loginChannel: gameSeed.loginChannel,
        regionLabel: gameSeed.region,
        heat: gameSeed.heat,
        shortDescription: gameSeed.description,
        selectionMode: gameSeed.selectionMode ?? VariantSelectionMode.NONE,
        isService: gameSeed.isService ?? false
      },
      update: {
        name: gameSeed.name,
        categoryId: category.id,
        posterUrl: `/assets/game-posters/${gameSeed.poster}`,
        posterSource: "AI-generated original marketplace artwork",
        platform: gameSeed.platform,
        loginChannel: gameSeed.loginChannel,
        regionLabel: gameSeed.region,
        heat: gameSeed.heat,
        shortDescription: gameSeed.description,
        selectionMode: gameSeed.selectionMode ?? VariantSelectionMode.NONE,
        isService: gameSeed.isService ?? false,
        active: true
      }
    });

    for (const [index, variant] of (gameSeed.variants ?? []).entries()) {
      await prisma.gameVariant.upsert({
        where: { gameId_slug: { gameId: game.id, slug: variant.slug } },
        create: { gameId: game.id, ...variant, sortOrder: index },
        update: { ...variant, sortOrder: index, active: true }
      });
    }

    for (const [index, code] of gameSeed.productCodes.entries()) {
      const [labelZh, labelEn, labelMs, riskStatus] = productTypes[code as keyof typeof productTypes];
      await prisma.gameProductType.upsert({
        where: { gameId_code: { gameId: game.id, code } },
        create: { gameId: game.id, code, labelZh, labelEn, labelMs, riskStatus, sortOrder: index },
        update: { labelZh, labelEn, labelMs, riskStatus, sortOrder: index, active: true }
      });
    }
  }

  for (const [legacySlug, parentSlug, variantSlug] of legacyVariants) {
    const [legacy, parent] = await Promise.all([
      prisma.game.findUnique({ where: { slug: legacySlug } }),
      prisma.game.findUnique({ where: { slug: parentSlug } })
    ]);
    if (!legacy || !parent) continue;
    const variant = await prisma.gameVariant.findUnique({ where: { gameId_slug: { gameId: parent.id, slug: variantSlug } } });
    await prisma.$transaction([
      prisma.listing.updateMany({ where: { gameId: legacy.id }, data: { gameId: parent.id, gameVariantId: variant?.id } }),
      prisma.game.update({ where: { id: legacy.id }, data: { active: false } })
    ]);
  }

  await prisma.game.updateMany({ where: { slug: "minecraft" }, data: { active: false } });

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const phone = process.env.INITIAL_ADMIN_PHONE;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (email && password) {
    const phoneNormalized = phone ? normalizeMalaysianPhone(phone) : null;
    const passwordHash = await hashPassword(password);
    await prisma.user.upsert({
      where: { emailNormalized: normalizeEmail(email) },
      create: {
        role: UserRole.ADMIN,
        name: process.env.INITIAL_ADMIN_NAME || "GameTrade Admin",
        email,
        emailNormalized: normalizeEmail(email),
        phone: phone || null,
        phoneNormalized,
        passwordHash,
        emailVerified: true,
        phoneVerified: false,
        primaryVerification: "EMAIL"
      },
      update: { role: UserRole.ADMIN, passwordHash, emailVerified: true, primaryVerification: "EMAIL" }
    });
  }

  await seedDemoMarketplace();
}

main().finally(() => prisma.$disconnect());
