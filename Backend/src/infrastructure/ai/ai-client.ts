import axios, { AxiosInstance, AxiosError } from "axios";
import { createModuleLogger } from "@/shared/utils/logger";
import { AppError } from "@/shared/errors";
import type {
  ParseResumeRequest,
  ParseResumeResponse,
  AnalyzeJobRequest,
  AnalyzeJobResponse,
  MatchRequest,
  MatchResponse,
  RankRequest,
  RankResponse,
  GenerateEmailRequest,
  GenerateEmailResponse,
  ScheduleInterviewAIRequest,
  ScheduleInterviewAIResponse,
  CheckBiasRequest,
  CheckBiasResponse,
} from "./ai.types";

const logger = createModuleLogger("ai-client");

/**
 * HTTP client for communicating with the teammate's AI service.
 * All methods are typed and handle errors gracefully.
 */
class AIClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.AI_SERVICE_URL;

    this.client = axios.create({
      baseURL,
      timeout: 150000, // 150s — AI operations can be slow, especially structured output parsing
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AI_SERVICE_API_KEY && {
          Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}`,
        }),
      },
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(
          { url: response.config.url, status: response.status },
          "AI service response"
        );
        return response;
      },
      (error: AxiosError<any>) => {
        const detail = error.response?.data?.detail || error.message;
        logger.error(
          {
            url: error.config?.url,
            status: error.response?.status,
            message: detail,
          },
          "AI service request failed"
        );
        throw new AppError(
          `AI service error: ${detail}`,
          502,
          "AI_SERVICE_ERROR"
        );
      }
    );
  }

  async parseResume(data: ParseResumeRequest): Promise<ParseResumeResponse> {
    const response = await this.client.post<ParseResumeResponse>(
      "/ai/parse-resume",
      data
    );
    return response.data;
  }

  async uploadAndParseResume(file: File): Promise<ParseResumeResponse> {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await this.client.post<ParseResumeResponse>(
      "/ai/upload-and-parse-resume",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      }
    );
    return response.data;
  }

  async analyzeJob(data: AnalyzeJobRequest): Promise<AnalyzeJobResponse> {
    const response = await this.client.post<AnalyzeJobResponse>(
      "/ai/analyze-job",
      data
    );
    return response.data;
  }

  async match(data: MatchRequest): Promise<MatchResponse> {
    const response = await this.client.post<MatchResponse>("/ai/match", data);
    return response.data;
  }

  async rank(data: RankRequest): Promise<RankResponse> {
    const response = await this.client.post<RankResponse>("/ai/rank", data);
    return response.data;
  }

  async generateEmail(data: GenerateEmailRequest): Promise<GenerateEmailResponse> {
    const response = await this.client.post<GenerateEmailResponse>(
      "/ai/generate-email",
      data
    );
    return response.data;
  }

  async scheduleInterview(
    data: ScheduleInterviewAIRequest
  ): Promise<ScheduleInterviewAIResponse> {
    const response = await this.client.post<ScheduleInterviewAIResponse>(
      "/ai/schedule-interview",
      data
    );
    return response.data;
  }

  async checkBias(data: CheckBiasRequest): Promise<CheckBiasResponse> {
    const response = await this.client.post<CheckBiasResponse>(
      "/ai/check-bias",
      data
    );
    return response.data;
  }
}

// Singleton
export const aiClient = new AIClient();
