import mongoose, { Schema, Document } from "mongoose";

// Interface for a value/principle
export interface ICompanyValue {
  icon: string; // Icon name from lucide-react
  title: string;
  description: string;
}

// Interface for team member
export interface ITeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
  order: number; // For sorting
}

// Interface for company story
export interface ICompanyStory {
  title: string;
  paragraphs: string[];
  image: string;
}

// Main CompanyInfo document interface
export interface ICompanyInfo extends Document {
  _id: string;
  // Company Story Section
  story: ICompanyStory;

  // Values Section
  values: ICompanyValue[];

  // Team Members Section
  team: ITeamMember[];

  // Call-to-Action Section
  cta: {
    title: string;
    description: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
  };

  // SEO metadata
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CompanyInfoSchema = new Schema<ICompanyInfo>(
  {
    story: {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        default: "Our Story",
      },
      paragraphs: [
        {
          type: String,
          trim: true,
          maxlength: 500,
        },
      ],
      image: {
        type: String,
        trim: true,
        default:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center",
      },
    },

    values: [
      {
        icon: {
          type: String,
          required: true,
          trim: true,
          maxlength: 50,
        },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: 300,
        },
      },
    ],

    team: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        role: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },
        image: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    cta: {
      title: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "Ready to Start Your Wellness Journey?",
      },
      description: {
        type: String,
        trim: true,
        maxlength: 300,
        default: "Join thousands who trust BeautyBook for their wellness needs",
      },
      primaryButtonText: {
        type: String,
        trim: true,
        maxlength: 50,
        default: "Explore Services",
      },
      primaryButtonLink: {
        type: String,
        trim: true,
        default: "/salons",
      },
      secondaryButtonText: {
        type: String,
        trim: true,
        maxlength: 50,
        default: "Become a Partner",
      },
      secondaryButtonLink: {
        type: String,
        trim: true,
        default: "/signup?type=vendor",
      },
    },

    seo: {
      title: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "About BeautyBook - Your Wellness Partner",
      },
      description: {
        type: String,
        trim: true,
        maxlength: 300,
        default:
          "Learn about BeautyBook, our mission, values, and the team dedicated to making wellness accessible to everyone.",
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
CompanyInfoSchema.index({ isActive: 1 });
CompanyInfoSchema.index({ updatedAt: -1 });

// Sort team members by order
CompanyInfoSchema.pre("find", function () {
  this.sort({ "team.order": 1 });
});

export default mongoose.models.CompanyInfo ||
  mongoose.model<ICompanyInfo>("CompanyInfo", CompanyInfoSchema);
