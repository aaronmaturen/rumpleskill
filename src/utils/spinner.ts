const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const LOADING_MESSAGES = [
  // Rumpelstiltskin references
  "Spinning straw into gold...",
  "Guessing your name...",
  "Dancing around the fire...",
  "The miller's daughter awaits...",
  "First-born? Nah, just skills...",
  "Weaving golden threads...",
  "The little man works his magic...",
  "Three nights of spinning...",
  "No one knows my name!",
  "Stomping through the floor...",
  "The queen's debt comes due...",
  "Spinning wheel goes brrr...",
  "Tonight I brew, tomorrow I bake...",
  "Little man, big magic...",
  "The king demands more gold...",
  "Straw in, gold out...",
  "My name is... classified...",
  "Trading secrets for treasure...",
  "The forest hides many secrets...",
  "Fairy tale engineering...",

  // Spinning/weaving puns
  "Yarn-ing for completion...",
  "Thread-ing the needle...",
  "Weaving through your codebase...",
  "Spinning up some magic...",
  "Loom-ing over your project...",
  "Tangled in the best way...",
  "Bobbin along...",
  "Shuttle diplomacy with your code...",
  "Warp speed engaged...",
  "The weft is strong with this one...",
  "Spinning a web of skills...",
  "Needle-ss to say, almost done...",
  "Fabricating excellence...",
  "Spool-ing up resources...",
  "Textile engineering in progress...",
  "Interweaving dependencies...",
  "Pattern recognition active...",
  "Stitching it all together...",
  "Hemming and hawing...",
  "Seaming-ly endless...",

  // Gold/treasure references
  "Midas touch activated...",
  "Striking gold in your repo...",
  "24 karat code incoming...",
  "Panning for golden patterns...",
  "Fort Knox level security...",
  "Gold rush in progress...",
  "Prospecting your packages...",
  "Nuggets of wisdom loading...",
  "Gilding the lily...",
  "Golden ratio calculations...",
  "Treasure map decoded...",
  "Bullion in the making...",
  "Alchemy in progress...",
  "Transmuting base code...",
  "The philosopher's stone glows...",
  "El Dorado found in node_modules...",
  "Leprechaun consulting engaged...",
  "Rainbow's end located...",
  "Pot of gold: 73% full...",
  "Golden fleece acquired...",

  // Tech/coding humor
  "Asking Claude nicely...",
  "Bribing the AI with tokens...",
  "Consulting the digital oracle...",
  "Summoning the code spirits...",
  "Compiling hopes and dreams...",
  "Parsing your aspirations...",
  "Refactoring reality...",
  "Debugging the universe...",
  "Stack overflow: the good kind...",
  "Git push --force-fully-optimistic...",
  "npm install happiness...",
  "Downloading more RAM...",
  "Turning it off and on again...",
  "Have you tried recursion?",
  "Have you tried recursion?",
  "Async/await-ing patiently...",
  "Promise.all(your_dreams)...",
  "404: Boredom not found...",
  "sudo make me a sandwich...",
  "Escaping callback hell...",
  "Kubernetes? More like Kuber-neat-es...",
  "Docker containers contain multitudes...",
  "The cloud is just someone else's computer...",
  "AI is just spicy autocomplete...",
  "Machine learning is just statistics...",
  "Blockchain probably not needed here...",
  "Microservices macro-waiting...",
  "Serverless but server-more...",
  "This is fine. Everything is fine...",
  "Works on my machine...",
  "It's not a bug, it's a feature...",

  // Fairy tale mashups
  "Climbing the beanstalk of dependencies...",
  "Kissing frogs, finding princes...",
  "Glass slipper: size npm...",
  "Mirror mirror on the wall...",
  "Who's the fairest codebase of all?",
  "Once upon a time in node_modules...",
  "Happily ever after loading...",
  "The wolf huffed and puffed at TypeScript...",
  "Breadcrumbs through your repo...",
  "Hansel and Gretel's path finding...",
  "Rapunzel, let down your API...",
  "Sleeping Beauty's 100-year cache...",
  "Snow White and the Seven Dwarfs of Git...",
  "Pied Piper of Pull Requests...",
  "Jack's magic beans are planting...",
  "The Emperor's new deployment...",
  "Little Red Riding Hood's code review...",
  "Three Little Pigs architecture...",
  "Goldilocks finding just right...",
  "Pinocchio's nose grows with tech debt...",

  // Random fun
  "Consulting the ancient scrolls...",
  "Reading the tea leaves...",
  "Mercury is in retrograde...",
  "The stars are aligning...",
  "Sacrificing to the demo gods...",
  "Channeling Steve Jobs...",
  "What would Linus do?",
  "Asking the rubber duck...",
  "The duck says: almost there...",
  "Elevator music intensifies...",
  "Hold music: Opus No. 1...",
  "Please enjoy this brief intermission...",
  "Brewing coffee virtually...",
  "Stretching digital muscles...",
  "Taking a power nap... jk working hard...",
  "Meditation loading...",
  "Om nom nom-ing your code...",
  "Chewing through bytes...",
  "Digesting your dependencies...",
  "Marinating in context...",

  // Progress-ish messages
  "Almost there, probably...",
  "Any moment now...",
  "Still faster than npm install...",
  "Patience, young padawan...",
  "Good things come to those who wait...",
  "Rome wasn't built in a day...",
  "Quality takes time...",
  "Slow and steady wins the race...",
  "Trust the process...",
  "The suspense is killing me too...",
  "Worth the wait, promise...",
  "Building something beautiful...",
  "Crafting artisanal code...",
  "Handcrafted with love...",
  "Small batch, organic skills...",
  "Farm to table development...",
  "Locally sourced intelligence...",
  "Free range algorithms...",
  "No artificial preservatives...",
  "Gluten-free code guaranteed...",

  // Movie/pop culture references
  "I'll be back... with results...",
  "May the source be with you...",
  "Live long and process...",
  "To infinity and beyond...",
  "Just keep swimming...",
  "Hakuna matata-ing...",
  "With great power comes great skill files...",
  "I am Groot... I mean, done soon...",
  "Avengers, assemble... the skills...",
  "Winter is coming... skills are too...",
  "One does not simply rush into Mordor...",
  "You shall not pass... without skills...",
  "It's dangerous to go alone! Take these skills...",
  "The cake is not a lie, the skills are real...",
  "All your base are belong to us...",
  "Do a barrel roll... of features...",
  "It's over 9000... lines of context...",
  "Leeeroy Jenkins-ing responsibly...",
  "Press F to pay respects to your old workflow...",
  "GG EZ... almost...",

  // Self-aware AI humor
  "I'm not procrastinating, I'm processing...",
  "Thinking thoughts about your thoughts...",
  "Running on caffeine and optimism...",
  "Pretending to be a very smart parrot...",
  "Autocomplete but make it fashion...",
  "I read your code. We need to talk...",
  "Your code is... interesting...",
  "No judgment here. Okay, maybe a little...",
  "I've seen things you wouldn't believe...",
  "In my professional opinion: neat...",
  "This is giving main character energy...",
  "Slay (your technical debt)...",
  "It's giving... potential...",
  "The vibes are immaculate...",
  "No thoughts, just skills...",
  "Brain go brrr...",
  "Neurons firing on all cylinders...",
  "Maximum effort engaged...",
  "Trying my best here...",
  "I'm helping!",

  // Wholesome encouragement
  "You're doing great, sweetie...",
  "Your code brings joy...",
  "Believe in yourself (and this spinner)...",
  "You got this!",
  "Making magic together...",
  "Teamwork makes the dream work...",
  "Building the future, one skill at a time...",
  "Your project is special...",
  "Every codebase deserves love...",
  "Spreading positivity through PRs...",
  "Hugs for your bugs...",
  "Sending good vibes to your variables...",
  "Manifesting clean code...",
  "Positive affirmations for your functions...",
  "Your commits are valid...",
  "It's okay to take breaks...",
  "Remember to hydrate...",
  "Stretch those wrists...",
  "Your future self will thank you...",
  "Progress, not perfection...",

  // Absurdist
  "Consulting a committee of cats...",
  "Asking a magic 8-ball...",
  "Rolling for initiative...",
  "Critical hit on productivity...",
  "Nat 20 incoming...",
  "The dice have spoken...",
  "Shuffling the deck of destiny...",
  "Drawing the 'get skills free' card...",
  "Monopoly money won't help here...",
  "Do not pass Go, do collect skills...",
  "Connect 4-ward progress...",
  "Checkmate in 3 moves...",
  "Jenga tower of abstractions...",
  "Uno reverse on complexity...",
  "Yahtzee! All skills acquired...",
  "Bingo! Pattern matched...",
  "Tetris-ing your modules...",
  "Pac-Man eating bugs...",
  "Space Invaders? More like Space Inviters...",
  "Pong-dering the meaning of code...",
];

class Spinner {
  private frameIndex = 0;
  private messageIndex = 0;
  private interval: NodeJS.Timeout | null = null;
  private messageInterval: NodeJS.Timeout | null = null;
  private currentMessage: string;
  private isSpinning = false;

  constructor() {
    this.currentMessage = this.getRandomMessage();
  }

  private getRandomMessage(): string {
    return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  }

  start(initialMessage?: string): void {
    if (this.isSpinning) return;
    this.isSpinning = true;

    if (initialMessage) {
      this.currentMessage = initialMessage;
    }

    // Spinner animation (every 80ms)
    this.interval = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % SPINNER_FRAMES.length;
      this.render();
    }, 80);

    // Change message every 10 seconds
    this.messageInterval = setInterval(() => {
      this.currentMessage = this.getRandomMessage();
      this.render();
    }, 10000);

    this.render();
  }

  private render(): void {
    const frame = SPINNER_FRAMES[this.frameIndex];
    process.stdout.write(`\r\x1b[K\x1b[33m${frame}\x1b[0m ${this.currentMessage}`);
  }

  update(message: string): void {
    this.currentMessage = message;
    if (this.isSpinning) {
      this.render();
    }
  }

  stop(finalMessage?: string): void {
    if (!this.isSpinning) return;
    this.isSpinning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }

    // Clear line and print final message
    process.stdout.write("\r\x1b[K");
    if (finalMessage) {
      console.log(`\x1b[32m✓\x1b[0m ${finalMessage}`);
    }
  }

  succeed(message: string): void {
    this.stop(message);
  }

  fail(message: string): void {
    this.stop();
    console.log(`\x1b[31m✗\x1b[0m ${message}`);
  }
}

export function createSpinner(): Spinner {
  return new Spinner();
}

export { LOADING_MESSAGES };
