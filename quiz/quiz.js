(() => {
  "use strict";

  const storageKey = "bst-character-quiz-v1";
  const traits = [
    "analysis", "warmth", "authority", "candor", "duty", "curiosity", "formality",
    "defiance", "empathy", "pragmatism", "composure", "idealism", "sociability", "caution",
  ];
  const traitLabels = {
    analysis: "Analysis", warmth: "Warmth", authority: "Authority", candor: "Candor",
    duty: "Duty", curiosity: "Curiosity", formality: "Formality", defiance: "Defiance",
    empathy: "Empathy", pragmatism: "Pragmatism", composure: "Composure",
    idealism: "Idealism", sociability: "Sociability", caution: "Caution",
  };

  const result = (name, portrait, tagline, description, strength, watch, values) => ({
    name, portrait: `../${portrait}`, tagline, description, strength, watch,
    vector: Object.fromEntries(traits.map((trait, index) => [trait, values[index]])),
  });

  const results = [
    result("Xie Liang", "assets/vn/portraits/portrait-xie-liang-f002-01.webp", "The quiet strategist who has already considered your objection.", "You read the incentives underneath what people say, plan several moves ahead, and prefer a calm solution that leaves everyone wondering when the decision was made. Feeling deeply rarely makes you less rational; it makes you hide the feeling inside a practical act.", "Seeing the whole board without losing sight of individual people.", "You can turn analysis into armor and treat your own needs as expendable variables.", [5,2,4,2,4,4,3,3,3,5,5,2,2,4]),
    result("Michio Mido", "assets/vn/portraits/portrait-michio-mido-f007-01.webp", "The human bridge with a joke ready for the impossible conversation.", "You make unbearable subjects discussable. Loose, funny, and street-smart on the surface, you are often the first person to notice what somebody is actually feeling—and the person most willing to say it plainly without making them feel small.", "Turning emotional truth into ordinary language people can live with.", "Helping everyone else can become a way to dodge the weight you carry yourself.", [4,4,3,5,3,2,1,4,5,5,3,3,5,2]),
    result("Ryouma Tachikawa", "assets/vn/portraits/portrait-ryouma-tachikawa-f006-01.webp", "The precise observer who cares by paying attention.", "You approach chaos diagnostically: establish facts, eliminate alternatives, ask the missing question. Your restraint can look cold, but careful attention is one of your most sincere forms of care. You would rather be exact than reassuring—and you are often exactly what a crisis needs.", "Remaining useful and clear-headed when everyone else loses the thread.", "Control and professional distance can keep you from admitting when you are personally implicated.", [5,2,3,3,4,4,5,2,3,4,5,2,1,5]),
    result("Sakura Noshida", "assets/vn/portraits/portrait-sakura-noshida-f012-01.webp", "The skeptic who refuses a beautiful lie.", "You have little patience for fake consolation, inflated language, or morality performed for an audience. Your candor is not emptiness: it comes from noticing emotional self-deception with painful accuracy. Trust is rare with you, but once chosen, it means something.", "Naming what is false even when everyone prefers the nicer story.", "Defensive skepticism can reject hope before it has the chance to prove itself.", [4,3,1,5,2,4,2,5,4,3,3,3,2,3]),
    result("Kuniaki Roji", "assets/vn/portraits/portrait-kuniaki-roji-f014-01.webp", "The investigator whose cynicism keeps betraying an inconvenient conscience.", "You test theories aloud, ask one follow-up too many, and distrust any answer that arrives too neatly. Sarcasm is camouflage for idealism: beneath the rough edges is someone who cannot stop caring whether the truth is known and whether people are treated as people.", "Following contradictory evidence farther than more comfortable thinkers will go.", "Your need to know can become recklessness, especially when injustice makes the case personal.", [5,3,2,4,3,5,2,4,4,3,3,4,3,2]),
    result("Matsuko Shio", "assets/vn/portraits/portrait-matsuko-shio-f003-01.webp", "The gentle witness whose courtesy conceals enormous resolve.", "You remember carefully, explain fairly, and worry about imposing even when you have every right to speak. Your softness is not weakness; it is a moral discipline. At the decisive moment, the hedging falls away and what remains is a quiet choice no one can move.", "Preserving humanity and context when fear encourages simplification.", "You may wait too long to claim space, mistaking self-effacement for kindness.", [3,4,2,3,5,3,5,2,5,3,4,4,2,4]),
    result("Xie Xiaoqiao", "assets/vn/portraits/portrait-xie-xiaoqiao-f001-01.webp", "The earnest heart asking the question everyone else learned not to ask.", "You are hungry for experience and incapable of treating life as merely abstract. A simple question from you can grow into a serious challenge to everyone’s assumptions. You attach fiercely, hope stubbornly, and keep trying to imagine a world larger than the one adults handed you.", "Making moral questions immediate, personal, and impossible to dismiss.", "Your need to believe in people can leave you dangerously exposed to their choices.", [2,5,1,5,2,5,2,4,5,1,1,5,4,1]),
    result("Tomas Liao", "assets/vn/portraits/portrait-tomas-liao-f025-01.webp", "The affectionate adventurer who grows steadier without growing hard.", "You are warm, curious, lightly scattered, and unusually willing to say that somebody matters to you. People underestimate your ability to command because your authority never requires emotional distance. You would rather invite courage out of someone than order it into them.", "Creating loyalty through tenderness, humor, and genuine trust.", "Optimism and affection can make you slow to recognize when warmth will not solve the problem.", [2,5,3,4,4,4,3,2,5,2,3,5,5,2]),
    result("Chris Xie", "assets/vn/portraits/portrait-chris-xie-f009-01.webp", "The charismatic leader who makes an alliance sound like common sense.", "You think in coalitions, loyalties, and decisive acts. You can fill a room without becoming pompous, shift from rough familiarity to public authority, and make people feel included in something larger. Even your threats tend to arrive as practical advice.", "Turning conviction into collective momentum.", "Confidence in your ability to carry everyone can become an excuse to decide for them.", [4,4,5,4,5,3,3,4,3,5,4,4,5,3]),
    result("Ma Ming", "assets/vn/portraits/portrait-ma-ming-f015-01.webp", "The blunt loyalist whose feelings arrive at full volume.", "You are protective, impatient, emotionally transparent, and much sharper than people who confuse polish with intelligence assume. You decide whom you stand beside and then stand there completely. Anger comes fast because care does too.", "Acting with total commitment when hesitation would cost someone dearly.", "Loyalty and temper can narrow the field until only one acceptable answer remains.", [3,4,4,5,5,2,2,4,3,4,2,3,3,2]),
    result("Alexey", "assets/vn/portraits/portrait-alexey-f029-01.webp", "The exhausted realist with a talent for bleak understatement.", "You strip situations down to what they are, not what anyone wishes they meant. Routine, danger, and absurdity all receive the same dry treatment. You are hard to shock, difficult to manipulate, and more disturbed by the world than your laconic delivery lets on.", "Seeing the brutal practical truth without theatricality or self-deception.", "Fatalism can make compassion feel useless before it has actually failed.", [4,1,3,4,2,3,1,4,1,5,5,1,1,4]),
    result("Sashen'ka", "assets/vn/portraits/portrait-sashen-ka-f067-01.webp", "The frightened optimist who keeps choosing trust anyway.", "You are gentle, hesitant, and honest about uncertainty. Safety lets your thoughts tumble out in earnest explanations, while danger makes you protective even when you feel helpless. Your courage is not fearlessness; it is refusing to let fear make every decision.", "Remaining tender and trustworthy in conditions designed to destroy both.", "Anxiety can convince you that asking for help is another burden you should apologize for.", [2,5,1,4,3,3,3,1,5,2,1,4,2,5]),
    result("Elly White", "assets/vn/portraits/portrait-elly-white-f028-01.webp", "The immaculate presence who can condemn you without raising her voice.", "You believe composure is a form of power and duty a structure worth inhabiting. Your language stays balanced under pressure, your social distance is deliberate, and your care tends to arrive as protection, ceremony, or an exact promise kept.", "Holding dignity and principle steady when circumstances become grotesque.", "Perfect control can hide the seams where identity, grief, and obligation are pulling against one another.", [4,3,4,3,5,2,5,2,4,3,5,4,2,4]),
    result("Rieko Haigami", "assets/vn/portraits/portrait-rieko-haigami-f020-01.webp", "The cool deadpan blade with the sharper social read.", "You stay composed where convention expects shock, notice the weak point in a target’s presentation, and deliver the smallest possible barb with maximum precision. Your loyalty runs deeper than your reaction markers suggest; you simply see no reason to perform the expected emotion for strangers.", "Reading the social battlefield and striking exactly where the façade is thinnest.", "Composure and irony can make real attachment invisible until it is under threat.", [4,2,3,5,4,3,3,4,3,4,5,2,2,3]),
    result("Eriko Haigami", "assets/vn/portraits/portrait-eriko-haigami-f021-03.webp", "The kinetic protector who would rather move than explain.", "You launch into action quickly, feel intensely, and meet fear with motion. Your emotional life is less hidden than people assume; it is compressed into short decisions, physical loyalty, and an immediate willingness to escalate when somebody you love is threatened.", "Converting devotion into action before anyone else has left their chair.", "Speed and protectiveness can carry you past the moment when reflection would change the target.", [2,4,3,4,5,3,1,5,4,4,2,3,3,2]),
    result("Camilla Northam", "assets/vn/portraits/portrait-camilla-northam-f115-01.webp", "The disciplined believer who turns conviction into procedure.", "You organize chaos through systems, clear roles, and a firm account of what must be done. Even your gentleness retains certainty. You do not abandon ideals when circumstances worsen; you operationalize them, shorten the sentence, and keep the group moving.", "Giving belief a structure sturdy enough to survive crisis.", "A coherent cause can make individual pain look like an administrative exception.", [4,2,5,4,5,3,4,3,2,5,4,5,2,3]),
  ];

  const q = (category, text, options) => ({ category, text, options });
  const questions = [
    q("Crisis", "A plan collapses five minutes before it matters. What do you do first?", [["Rebuild it from the known facts.",["analysis","composure","pragmatism"]],["Check who is panicking and steady them.",["empathy","warmth","sociability"]],["Take command and assign jobs.",["authority","duty","pragmatism"]],["Move immediately; a flawed action beats paralysis.",["defiance","candor","authority"]]]),
    q("Trust", "A charming stranger offers you exactly what you need. Your reaction?", [["Ask what they gain from the arrangement.",["analysis","caution","pragmatism"]],["Accept provisionally; trust has to begin somewhere.",["idealism","warmth","curiosity"]],["Decline. Convenient timing is still suspicious timing.",["caution","defiance","composure"]],["Bring them into a room with witnesses and negotiate openly.",["authority","sociability","candor"]]]),
    q("Friendship", "You know a friend is lying to protect you. What now?", [["Let the lie stand until you understand the threat.",["analysis","caution","empathy"]],["Tell them gently that protection without consent is still a lie.",["candor","empathy","warmth"]],["Get angry. You should be allowed to choose your own risk.",["defiance","candor","idealism"]],["Work around them and solve the danger yourself.",["pragmatism","duty","composure"]]]),
    q("Authority", "A rule is unjust but breaking it will endanger your group. You…", [["Find a technical interpretation that defeats the rule.",["analysis","defiance","caution"]],["Break it and take responsibility publicly.",["authority","idealism","candor"]],["Protect the group first, then change the system.",["duty","pragmatism","composure"]],["Ask the people at risk what price they are willing to pay.",["empathy","candor","sociability"]]]),
    q("Atmosphere", "Pick a place to walk through the City at night.", [["A bright food street full of overheard lives.",["sociability","curiosity","warmth"]],["A silent hospital corridor.",["analysis","formality","composure"]],["The rooftops, where no one can tell you where to go.",["defiance","curiosity","idealism"]],["A back office where tomorrow’s decisions are being made.",["authority","pragmatism","duty"]]]),
    q("Downtime", "Your ideal day off has unexpectedly arrived. You choose…", [["A long meal with people who make you laugh.",["warmth","sociability","empathy"]],["A book, a locked door, and no obligations.",["curiosity","composure","caution"]],["A strange neighborhood you have never explored.",["curiosity","idealism","defiance"]],["Catching up on the tasks everyone else forgot.",["duty","pragmatism","analysis"]]]),
    q("Argument", "How do you usually win an argument?", [["Trace the other person’s premise to its contradiction.",["analysis","composure","candor"]],["Make the issue human enough that they cannot hide in abstraction.",["empathy","warmth","idealism"]],["State the obvious thing everyone is avoiding.",["candor","defiance","pragmatism"]],["Build a coalition before the argument begins.",["authority","sociability","caution"]]]),
    q("Care", "You find an injured stranger who insists they are fine.", [["Assess them before debating the word ‘fine.’",["analysis","duty","composure"]],["Stay nearby and talk until they accept help.",["warmth","empathy","sociability"]],["Call for help over their objection.",["authority","pragmatism","duty"]],["Ask what they are afraid will happen if they admit it.",["empathy","curiosity","candor"]]]),
    q("Danger", "Someone threatens you in a perfectly polite voice. You…", [["Answer even more politely and make them clarify.",["formality","composure","analysis"]],["Laugh. If it is a threat, they can say it plainly.",["defiance","candor","sociability"]],["Map exits, allies, and their likely next move.",["caution","analysis","pragmatism"]],["Step between them and whoever they are really targeting.",["duty","authority","warmth"]]]),
    q("Leadership", "A group cannot agree on a direction. Your instinct is to…", [["Summarize the actual disagreement.",["analysis","candor","formality"]],["Ask the quietest person what they think.",["empathy","warmth","sociability"]],["Choose a direction before the window closes.",["authority","pragmatism","composure"]],["Refuse the false choice and propose something stranger.",["defiance","curiosity","idealism"]]]),
    q("Secrets", "Which secret is hardest for you to keep?", [["One that puts an innocent person at risk.",["duty","idealism","empathy"]],["One whose logic does not add up.",["analysis","curiosity","candor"]],["One about someone I love.",["warmth","caution","duty"]],["One imposed by a person with no right to command me.",["defiance","candor","authority"]]]),
    q("Reputation", "Someone criticizes you unfairly in public. You…", [["Correct the factual record, nothing more.",["composure","analysis","formality"]],["Return a sharper criticism with excellent timing.",["candor","defiance","sociability"]],["Ignore it unless it harms the work.",["duty","pragmatism","caution"]],["Wonder what made them need an audience.",["empathy","curiosity","warmth"]]]),
    q("Morality", "A bad act would prevent a worse outcome. Your answer depends most on…", [["Whether every alternative has truly been eliminated.",["analysis","caution","duty"]],["Who gets to define ‘worse.’",["defiance","candor","idealism"]],["Whether I can bear the consequence myself.",["duty","authority","pragmatism"]],["Whether the people affected have a voice.",["empathy","sociability","idealism"]]]),
    q("Future", "The future feels most real to you as…", [["A set of branching consequences.",["analysis","caution","curiosity"]],["The ordinary days I want with specific people.",["warmth","empathy","idealism"]],["Something we build through collective action.",["authority","duty","sociability"]],["An open door. I do not need to name what is behind it.",["defiance","curiosity","composure"]]]),
    q("Workspace", "Pick the desk that feels most like yours.", [["Immaculate, labeled, and ready for a crisis.",["formality","duty","caution"]],["Chaotic, but I know where everything is.",["curiosity","sociability","pragmatism"]],["Almost empty: one notebook, one excellent pen.",["composure","analysis","formality"]],["Covered in objects that remind me of people.",["warmth","empathy","idealism"]]]),
    q("Betrayal", "A trusted ally betrays you for reasons you understand. You…", [["Understanding is not absolution.",["candor","composure","duty"]],["Ask whether the relationship can survive the truth.",["empathy","warmth","idealism"]],["Use what I understand to predict their next move.",["analysis","pragmatism","caution"]],["Confront them immediately. Reasons can wait.",["defiance","authority","candor"]]]),
    q("Grief", "Someone you love is grieving. What do you offer?", [["Company without a deadline.",["warmth","empathy","composure"]],["A practical task so tomorrow is survivable.",["duty","pragmatism","caution"]],["Permission to say the ugly part aloud.",["candor","empathy","defiance"]],["A careful account of what can still be done.",["analysis","idealism","formality"]]]),
    q("Apologies", "A sincere apology should contain…", [["A precise account of the harm.",["analysis","candor","duty"]],["No demand to be forgiven.",["empathy","composure","formality"]],["A concrete change in behavior.",["pragmatism","duty","authority"]],["The courage to sound emotionally undignified.",["warmth","defiance","candor"]]]),
    q("Risk", "Which risk are you most willing to take?", [["Looking foolish for someone I love.",["warmth","sociability","empathy"]],["Breaking rank when the cause is wrong.",["defiance","idealism","candor"]],["Carrying responsibility no one else wants.",["duty","authority","composure"]],["Following evidence into dangerous territory.",["curiosity","analysis","caution"]]]),
    q("Truth", "What kind of truth matters most?", [["The verifiable kind.",["analysis","formality","composure"]],["The emotional truth underneath the words.",["empathy","warmth","candor"]],["The truth powerful people agreed not to mention.",["defiance","curiosity","idealism"]],["The truth that changes what we do next.",["pragmatism","authority","duty"]]]),
    q("Command", "If you had to lead, what would your style be?", [["Quiet preparation and very few surprises.",["caution","analysis","composure"]],["Visible conviction and a shared mission.",["authority","idealism","sociability"]],["Direct conversation tailored to each person.",["empathy","warmth","pragmatism"]],["Clear rules, roles, and consequences.",["duty","formality","authority"]]]),
    q("Conflict", "Your anger is usually…", [["Cold enough to become a plan.",["analysis","composure","pragmatism"]],["Fast, loud, and protective.",["defiance","duty","candor"]],["Rare, but devastatingly specific.",["formality","candor","caution"]],["Mostly sadness that found a sharper word.",["empathy","warmth","idealism"]]]),
    q("Home", "Home is best defined as…", [["The people who expect you back.",["warmth","empathy","duty"]],["A place where your guard can finally lower.",["caution","composure","warmth"]],["Something built and defended together.",["authority","idealism","pragmatism"]],["A dangerous word if other people define it for you.",["defiance","candor","analysis"]]]),
    q("Gifts", "Choose a gift to receive.", [["A tool selected with alarming accuracy.",["pragmatism","analysis","duty"]],["A letter saying what the writer normally cannot.",["empathy","warmth","candor"]],["A key with no explanation.",["curiosity","defiance","caution"]],["A formal token carrying an old promise.",["formality","idealism","composure"]]]),
    q("Party", "At a crowded party, where are you?", [["Introducing people who should know each other.",["sociability","warmth","authority"]],["In the kitchen having the only honest conversation.",["empathy","candor","pragmatism"]],["Watching the room from a defensible corner.",["caution","analysis","composure"]],["Leaving early with one interesting person.",["defiance","curiosity","warmth"]]]),
    q("Science", "A strange experiment could change how people understand humanity. You ask…", [["What are the controls?",["analysis","formality","caution"]],["Who consented?",["empathy","candor","duty"]],["Who controls the result?",["defiance","authority","pragmatism"]],["What if it works?",["curiosity","idealism","warmth"]]]),
    q("Memory", "Your memories behave most like…", [["Evidence files I keep reopening.",["analysis","curiosity","composure"]],["Rooms I enter more carefully with age.",["caution","empathy","formality"]],["Stories that change depending on who is listening.",["sociability","candor","warmth"]],["Fuel. I do not need them to be gentle.",["defiance","duty","pragmatism"]]]),
    q("Promises", "When do you break a promise?", [["When keeping it would betray its original purpose.",["analysis","duty","pragmatism"]],["When the person bound by it asks to be released.",["empathy","candor","warmth"]],["When it was extracted through illegitimate authority.",["defiance","idealism","authority"]],["Almost never. A promise should survive inconvenience.",["formality","composure","duty"]]]),
    q("Fear", "When you are genuinely afraid, you tend to…", [["Become unusually quiet and exact.",["caution","analysis","composure"]],["Move before the fear can settle.",["defiance","pragmatism","duty"]],["Talk more, trying to make the danger human-sized.",["sociability","warmth","empathy"]],["Ask for reassurance, then apologize for asking.",["empathy","formality","caution"]]]),
    q("Voice", "Under pressure, your sentences become…", [["Shorter and more commanding.",["authority","duty","pragmatism"]],["Longer, because every condition matters.",["analysis","caution","formality"]],["Blunter; social cushioning is the first casualty.",["candor","defiance","composure"]],["Messier, but more emotionally honest.",["warmth","empathy","sociability"]]]),
    q("Belonging", "A newcomer clearly does not fit in. You…", [["Explain the unwritten rules privately.",["empathy","formality","pragmatism"]],["Ask what the group could change instead.",["idealism","defiance","curiosity"]],["Give them a useful role immediately.",["duty","authority","sociability"]],["Watch first. Exclusion is not always the whole story.",["caution","analysis","composure"]]]),
    q("Justice", "You witness a small injustice everyone else ignores.", [["Intervene immediately and plainly.",["candor","defiance","duty"]],["Document it; patterns matter.",["analysis","curiosity","caution"]],["Check what the harmed person wants.",["empathy","warmth","composure"]],["Use your influence so it cannot happen again.",["authority","pragmatism","idealism"]]]),
    q("Affection", "How do you most naturally show affection?", [["I solve a problem before they know it exists.",["duty","pragmatism","caution"]],["I say it. Why make love guess?",["warmth","candor","sociability"]],["I remember the precise details they mention.",["empathy","analysis","curiosity"]],["I stand beside them when doing so is costly.",["defiance","duty","idealism"]]]),
    q("Impossible choices", "Two people need you and you can only reach one. You…", [["Choose by likelihood of success.",["pragmatism","analysis","composure"]],["Choose the person no one else will choose.",["empathy","idealism","defiance"]],["Create a plan that gives the group a chance at both.",["authority","duty","curiosity"]],["Choose, then carry the moral cost without rewriting it.",["candor","duty","formality"]]]),
    q("Mystery", "A clue contradicts your favorite theory.", [["Good. The theory needed to die.",["analysis","candor","composure"]],["Set it aside until more context appears.",["caution","pragmatism","curiosity"]],["Ask who benefits from the contradiction.",["defiance","authority","analysis"]],["Bring it to someone whose instincts differ from mine.",["sociability","empathy","warmth"]]]),
    q("Organization", "What keeps a group together?", [["A leader people genuinely trust.",["authority","warmth","sociability"]],["Shared rules that apply even when inconvenient.",["duty","formality","idealism"]],["Ordinary relationships stronger than the mission.",["empathy","warmth","candor"]],["Mutual interest and honest consequences.",["pragmatism","analysis","caution"]]]),
    q("Victory", "After a major victory, you are most likely to…", [["Check what the win changed—and what it did not.",["analysis","composure","pragmatism"]],["Throw a party before reality catches up.",["sociability","warmth","defiance"]],["Thank everyone and redirect credit.",["formality","empathy","duty"]],["Secure the next objective immediately.",["authority","caution","pragmatism"]]]),
    q("Loss", "After a major loss, you are most likely to…", [["Replay every decision until I find the break.",["analysis","duty","caution"]],["Keep everyone fed, moving, and together.",["warmth","pragmatism","sociability"]],["Go quiet until I can speak without lying.",["candor","composure","empathy"]],["Turn grief into a cause.",["idealism","authority","defiance"]]]),
    q("Rumors", "A wild rumor about you starts circulating. Pick your response.", [["Nothing. Useful people know how to ask.",["composure","caution","formality"]],["Improve it. If I must have a rumor, it should be entertaining.",["sociability","defiance","candor"]],["Trace the source and motive.",["analysis","curiosity","pragmatism"]],["Correct anyone the rumor could actually hurt.",["empathy","duty","warmth"]]]),
    q("Flaws", "Which flaw sounds most familiar?", [["I overthink emotions until they become logistics.",["analysis","caution","duty"]],["I take responsibility that was not actually assigned to me.",["duty","authority","idealism"]],["I use humor or sharpness to control distance.",["candor","sociability","defiance"]],["I assume care means I should ask for less.",["empathy","warmth","formality"]]]),
    q("Loyalty", "Loyalty should be…", [["Earned repeatedly, never presumed.",["caution","candor","analysis"]],["Absolute once freely chosen.",["duty","defiance","warmth"]],["Strong enough to survive disagreement.",["empathy","idealism","sociability"]],["Directed toward principles, not personalities.",["formality","composure","authority"]]]),
    q("Planning", "You have ten years to accomplish one difficult thing. Your first move?", [["Build a model of every dependency.",["analysis","caution","pragmatism"]],["Find the people who can believe in it together.",["sociability","idealism","authority"]],["Create one small version that helps someone now.",["empathy","duty","pragmatism"]],["Make sure the goal is mine before sacrificing a decade.",["defiance","candor","curiosity"]]]),
    q("Strangers", "A stranger asks for a favor but refuses to explain why.", [["No explanation, no agreement.",["candor","caution","defiance"]],["I will help if the immediate request harms no one.",["warmth","pragmatism","empathy"]],["I need enough facts to define the risk.",["analysis","formality","caution"]],["I will decide—and they will owe me the truth afterward.",["authority","duty","sociability"]]]),
    q("Taste", "Pick a late-night food-stall order.", [["Whatever the vendor says is best.",["sociability","curiosity","warmth"]],["Something familiar, hot, and reliable.",["caution","pragmatism","duty"]],["The strangest item on the board.",["defiance","curiosity","idealism"]],["Tea first. Decisions improve after tea.",["composure","formality","analysis"]]]),
    q("Institutions", "An institution you respect makes a terrible decision.", [["Work internally to reverse it with evidence.",["analysis","formality","duty"]],["Resign publicly and explain why.",["candor","defiance","idealism"]],["Protect the people affected while deciding what comes next.",["empathy","pragmatism","caution"]],["Take control of the response if no one else will.",["authority","duty","composure"]]]),
    q("Legacy", "What would you most want to leave behind?", [["A system that keeps helping after I am gone.",["duty","authority","pragmatism"]],["People who know they were loved plainly.",["warmth","empathy","candor"]],["An honest record nobody can erase.",["analysis","curiosity","idealism"]],["Proof that the world’s categories were never final.",["defiance","idealism","composure"]]]),
    q("Hidden talents", "Choose a secret talent.", [["Remembering exact conversations years later.",["analysis","empathy","curiosity"]],["Getting hostile people to sit at one table.",["sociability","authority","warmth"]],["Staying eerily calm in emergencies.",["composure","pragmatism","caution"]],["Delivering one sentence that ends an argument.",["candor","defiance","formality"]]]),
    q("Style", "Choose the sentence people might say about you.", [["‘They notice everything and explain almost nothing.’",["analysis","composure","caution"]],["‘They made the worst day feel survivable.’",["warmth","empathy","sociability"]],["‘Once they chose a side, that was the end of the discussion.’",["duty","defiance","authority"]],["‘They were unfailingly polite, which somehow made it worse.’",["formality","candor","composure"]]]),
    q("The City", "The City offers you power at a personal cost. You…", [["Accept only if I can define the cost and the exit.",["analysis","caution","pragmatism"]],["Accept if it protects people who have none.",["duty","authority","empathy"]],["Refuse. Power that chooses my price has already won.",["defiance","candor","idealism"]],["Ask who else can share both power and cost.",["sociability","warmth","authority"]]]),
    q("Final answer", "Pick the principle you would carry into the end of the story.", [["Understand first; act precisely.",["analysis","composure","caution"]],["People are never only the role assigned to them.",["empathy","idealism","curiosity"]],["If I choose you, I will stand there completely.",["duty","warmth","defiance"]],["A future has to be built, not merely hoped for.",["authority","pragmatism","sociability"]]]),
  ];

  const elements = {
    intro: document.querySelector("#intro-panel"), question: document.querySelector("#question-panel"),
    result: document.querySelector("#result-panel"), start: document.querySelector("#start-quiz"),
    count: document.querySelector("#question-count"), percent: document.querySelector("#progress-percent"),
    fill: document.querySelector("#progress-fill"), category: document.querySelector("#question-category"),
    text: document.querySelector("#question-text"), answers: document.querySelector("#answer-list"),
    previous: document.querySelector("#previous-question"), next: document.querySelector("#next-question"),
    portrait: document.querySelector("#result-portrait"), name: document.querySelector("#result-name"),
    tagline: document.querySelector("#result-tagline"), description: document.querySelector("#result-description"),
    strength: document.querySelector("#result-strength"), watch: document.querySelector("#result-watch"),
    bars: document.querySelector("#trait-bars"), runnerUp: document.querySelector("#runner-up"),
    copy: document.querySelector("#copy-result"), restart: document.querySelector("#restart-quiz"),
  };
  const state = { index: 0, answers: Array(questions.length).fill(null), ranking: [] };

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ index: state.index, answers: state.answers })); } catch { /* optional */ }
  }

  function show(panel) {
    for (const candidate of [elements.intro, elements.question, elements.result]) candidate.hidden = candidate !== panel;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderQuestion() {
    const question = questions[state.index];
    const progress = Math.round(((state.index + 1) / questions.length) * 100);
    elements.count.textContent = `Question ${state.index + 1} of ${questions.length}`;
    elements.percent.textContent = `${progress}%`;
    elements.fill.style.width = `${progress}%`;
    elements.category.textContent = question.category;
    elements.text.textContent = question.text;
    elements.answers.replaceChildren();
    question.options.forEach(([label], optionIndex) => {
      const answer = document.createElement("label");
      answer.className = "answer-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "quiz-answer";
      input.value = String(optionIndex);
      input.checked = state.answers[state.index] === optionIndex;
      input.addEventListener("change", () => {
        state.answers[state.index] = optionIndex;
        elements.next.disabled = false;
        save();
      });
      const copy = document.createElement("span");
      copy.textContent = label;
      answer.append(input, copy);
      elements.answers.append(answer);
    });
    elements.previous.disabled = state.index === 0;
    elements.next.disabled = state.answers[state.index] === null;
    elements.next.textContent = state.index === questions.length - 1 ? "Reveal my character →" : "Next →";
    show(elements.question);
    elements.text.focus({ preventScroll: true });
  }

  function traitScores() {
    const scores = Object.fromEntries(traits.map((trait) => [trait, 0]));
    state.answers.forEach((answer, questionIndex) => {
      if (answer === null) return;
      questions[questionIndex].options[answer][1].forEach((trait, rank) => { scores[trait] += 3 - rank; });
    });
    return scores;
  }

  function correlation(left, right) {
    const leftMean = traits.reduce((sum, trait) => sum + left[trait], 0) / traits.length;
    const rightMean = traits.reduce((sum, trait) => sum + right[trait], 0) / traits.length;
    let numerator = 0;
    let leftSquare = 0;
    let rightSquare = 0;
    for (const trait of traits) {
      const a = left[trait] - leftMean;
      const b = right[trait] - rightMean;
      numerator += a * b;
      leftSquare += a * a;
      rightSquare += b * b;
    }
    return numerator / Math.sqrt(leftSquare * rightSquare || 1);
  }

  function calculateRanking() {
    const scores = traitScores();
    state.ranking = results.map((character, index) => ({
      character,
      score: correlation(scores, character.vector) + index * 0.000001,
    })).sort((a, b) => b.score - a.score);
    return scores;
  }

  function renderResult() {
    const scores = calculateRanking();
    const winner = state.ranking[0].character;
    const runnerUp = state.ranking[1].character;
    elements.portrait.src = winner.portrait;
    elements.portrait.alt = `${winner.name} character portrait`;
    elements.name.textContent = winner.name;
    elements.tagline.textContent = winner.tagline;
    elements.description.textContent = winner.description;
    elements.strength.textContent = winner.strength;
    elements.watch.textContent = winner.watch;
    elements.runnerUp.textContent = `Your close second was ${runnerUp.name}—the part of you that appears when circumstances change.`;
    const topTraits = [...traits].sort((a, b) => scores[b] - scores[a]).slice(0, 5);
    const max = Math.max(...topTraits.map((trait) => scores[trait]), 1);
    elements.bars.replaceChildren();
    for (const trait of topTraits) {
      const row = document.createElement("div");
      row.className = "trait-bar";
      const label = document.createElement("span");
      label.textContent = traitLabels[trait];
      const meter = document.createElement("span");
      meter.className = "trait-meter";
      const fill = document.createElement("span");
      fill.style.width = `${Math.round((scores[trait] / max) * 100)}%`;
      meter.append(fill);
      const score = document.createElement("span");
      score.className = "trait-score";
      score.textContent = String(scores[trait]);
      row.append(label, meter, score);
      elements.bars.append(row);
    }
    show(elements.result);
  }

  elements.start.addEventListener("click", () => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { saved = null; }
    if (saved && Array.isArray(saved.answers) && saved.answers.length === questions.length) {
      state.answers = saved.answers.map((answer) => Number.isInteger(answer) && answer >= 0 && answer < 4 ? answer : null);
      state.index = Math.min(Math.max(Number(saved.index) || 0, 0), questions.length - 1);
    }
    renderQuestion();
  });
  elements.previous.addEventListener("click", () => { if (state.index > 0) { state.index -= 1; save(); renderQuestion(); } });
  elements.next.addEventListener("click", () => {
    if (state.answers[state.index] === null) return;
    if (state.index === questions.length - 1) renderResult();
    else { state.index += 1; save(); renderQuestion(); }
  });
  elements.restart.addEventListener("click", () => {
    state.index = 0;
    state.answers.fill(null);
    try { localStorage.removeItem(storageKey); } catch { /* optional */ }
    renderQuestion();
  });
  elements.copy.addEventListener("click", async () => {
    const text = `I got ${state.ranking[0].character.name} in the Black Sheep Town character quiz. Who are you? ${location.href}`;
    try {
      await navigator.clipboard.writeText(text);
      elements.copy.textContent = "Copied!";
      setTimeout(() => { elements.copy.textContent = "Copy result"; }, 1600);
    } catch {
      window.prompt("Copy your result:", text);
    }
  });

  if (questions.length !== 50 || questions.some((question) => question.options.length !== 4)) {
    throw new Error("The quiz must contain exactly 50 four-choice questions.");
  }
})();
