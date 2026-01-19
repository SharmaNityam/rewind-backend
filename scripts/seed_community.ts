
import { AppDataSource } from '../src/config/typeorm';
import { User, CommunityPost } from '../src/entities';
import { v4 as uuidv4 } from 'uuid';

// Note: You need to install @faker-js/faker or just use simple arrays
// For simplicity without installing new deps, I'll use arrays.

const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=60'
];

const SAMPLE_TAGS = ['NATURE', 'GRATITUDE', 'STRESS', 'HAPPINESS', 'WORK', 'DAILY'];

const SAMPLE_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona', 'George'];

const SAMPLE_POSTS = [
    "Just had the most amazing walk in the park. Nature is healing!",
    "Feeling a bit stressed about work deadlines, but trying to breathe.",
    "Grateful for my family and friends today.",
    "Look at this beautiful sunset!",
    "Does anyone else feel like time is moving too fast?",
    "My cat did the funniest thing today.",
    "Working on a new project, exciting things coming!"
];

async function seed() {
    await AppDataSource.initialize();
    console.log("Database connected. Seeding...");

    // Create random users
    const users: User[] = [];
    for (const name of SAMPLE_NAMES) {
        let user = await AppDataSource.getRepository(User).findOneBy({ email: `${name.toLowerCase()}@example.com` });

        if (!user) {
            user = new User();
            user.id = uuidv4();
            user.name = name;
            user.email = `${name.toLowerCase()}@example.com`;
            user.passwordHash = 'password'; // dummy
            user.createdAt = new Date();
            user.updatedAt = new Date();
            await AppDataSource.manager.save(user);
            console.log(`Created user: ${name}`);
        }
        users.push(user);
    }

    // Create Posts
    for (let i = 0; i < 15; i++) {
        const post = new CommunityPost();
        const user = users[Math.floor(Math.random() * users.length)];

        post.id = uuidv4();
        post.user = user;
        post.userId = user.id; // Explicitly set if relation doesn't auto-set
        post.content = SAMPLE_POSTS[Math.floor(Math.random() * SAMPLE_POSTS.length)];
        post.isAnonymous = Math.random() > 0.8;

        // Random tags
        const numTags = Math.floor(Math.random() * 3);
        const tags: string[] = [];
        for (let j = 0; j < numTags; j++) {
            tags.push(SAMPLE_TAGS[Math.floor(Math.random() * SAMPLE_TAGS.length)]);
        }
        post.tags = tags;

        // Random Images (0-3)
        const numImages = Math.floor(Math.random() * 4);
        const images: string[] = [];
        for (let k = 0; k < numImages; k++) {
            images.push(SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)]);
        }
        post.mediaUrls = images;

        post.likeCount = Math.floor(Math.random() * 50);
        post.commentCount = Math.floor(Math.random() * 10);
        post.createdAt = new Date(Date.now() - Math.floor(Math.random() * 1000000000)); // Random time in past
        post.updatedAt = new Date();

        await AppDataSource.manager.save(post);
        console.log(`Created post by ${user.name}`);
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch(err => console.error(err));
