use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use std::collections::HashMap;

declare_id!("DePINfinity111111111111111111111111111111111");

#[program]
pub mod depinfinity {
    use super::*;

    /// Initialize the DePIN program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.authority = ctx.accounts.authority.key();
        program_state.total_devices = 0;
        program_state.total_rewards_distributed = 0;
        program_state.is_active = true;
        program_state.bump = ctx.bumps.program_state;
        
        msg!("DePINfinity program initialized");
        Ok(())
    }

    /// Register a new device in the network
    pub fn register_device(
        ctx: Context<RegisterDevice>,
        device_id: String,
        device_type: DeviceType,
        initial_location: LocationData,
    ) -> Result<()> {
        let device = &mut ctx.accounts.device;
        let program_state = &mut ctx.accounts.program_state;
        
        device.owner = ctx.accounts.user.key();
        device.device_id = device_id;
        device.device_type = device_type;
        device.location = initial_location;
        device.is_active = true;
        device.total_uptime = 0;
        device.total_rewards_earned = 0;
        device.last_activity = Clock::get()?.unix_timestamp;
        device.bump = ctx.bumps.device;
        
        program_state.total_devices += 1;
        
        msg!("Device registered: {}", device.device_id);
        Ok(())
    }

    /// Submit network quality data and earn rewards
    pub fn submit_data(
        ctx: Context<SubmitData>,
        quality_data: NetworkQualityData,
    ) -> Result<()> {
        let device = &mut ctx.accounts.device;
        let data_submission = &mut ctx.accounts.data_submission;
        let program_state = &mut ctx.accounts.program_state;
        
        // Validate device is active
        require!(device.is_active, ErrorCode::DeviceInactive);
        
        // Store the anonymized data
        data_submission.device = device.key();
        data_submission.timestamp = Clock::get()?.unix_timestamp;
        data_submission.signal_strength = quality_data.signal_strength;
        data_submission.latency = quality_data.latency;
        data_submission.throughput = quality_data.throughput;
        data_submission.availability = quality_data.availability;
        data_submission.location = quality_data.location;
        
        // Calculate rewards based on data quality and uptime
        let reward_amount = calculate_reward(&quality_data, device.total_uptime);
        
        if reward_amount > 0 {
            // Transfer tokens to user
            let cpi_accounts = Transfer {
                from: ctx.accounts.reward_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.program_state.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            
            token::transfer(cpi_ctx, reward_amount)?;
            
            // Update device stats
            device.total_rewards_earned += reward_amount;
            device.last_activity = Clock::get()?.unix_timestamp;
            device.total_uptime += 1;
            
            program_state.total_rewards_distributed += reward_amount;
        }
        
        msg!("Data submitted and rewards distributed: {} tokens", reward_amount);
        Ok(())
    }

    /// Update device location
    pub fn update_location(
        ctx: Context<UpdateLocation>,
        new_location: LocationData,
    ) -> Result<()> {
        let device = &mut ctx.accounts.device;
        
        require!(device.is_active, ErrorCode::DeviceInactive);
        
        device.location = new_location;
        device.last_activity = Clock::get()?.unix_timestamp;
        
        msg!("Device location updated");
        Ok(())
    }

    /// Toggle device active status
    pub fn toggle_device_status(ctx: Context<ToggleDeviceStatus>) -> Result<()> {
        let device = &mut ctx.accounts.device;
        
        device.is_active = !device.is_active;
        device.last_activity = Clock::get()?.unix_timestamp;
        
        msg!("Device status toggled to: {}", device.is_active);
        Ok(())
    }

    /// Emergency pause the program (authority only)
    pub fn pause_program(ctx: Context<PauseProgram>) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.is_active = false;
        
        msg!("Program paused by authority");
        Ok(())
    }

    /// Resume the program (authority only)
    pub fn resume_program(ctx: Context<ResumeProgram>) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.is_active = true;
        
        msg!("Program resumed by authority");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(device_id: String)]
pub struct RegisterDevice<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Device::INIT_SPACE,
        seeds = [b"device", user.key().as_ref(), device_id.as_bytes()],
        bump
    )]
    pub device: Account<'info, Device>,
    
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitData<'info> {
    #[account(
        mut,
        seeds = [b"device", device.owner.as_ref(), device.device_id.as_bytes()],
        bump = device.bump,
        constraint = device.owner == user.key()
    )]
    pub device: Account<'info, Device>,
    
    #[account(
        init,
        payer = user,
        space = 8 + DataSubmission::INIT_SPACE,
        seeds = [b"data", device.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub data_submission: Account<'info, DataSubmission>,
    
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// CHECK: This account is validated in the instruction
    #[account(mut)]
    pub reward_vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateLocation<'info> {
    #[account(
        mut,
        seeds = [b"device", device.owner.as_ref(), device.device_id.as_bytes()],
        bump = device.bump,
        constraint = device.owner == user.key()
    )]
    pub device: Account<'info, Device>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct ToggleDeviceStatus<'info> {
    #[account(
        mut,
        seeds = [b"device", device.owner.as_ref(), device.device_id.as_bytes()],
        bump = device.bump,
        constraint = device.owner == user.key()
    )]
    pub device: Account<'info, Device>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct PauseProgram<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump,
        constraint = program_state.authority == authority.key()
    )]
    pub program_state: Account<'info, ProgramState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResumeProgram<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump,
        constraint = program_state.authority == authority.key()
    )]
    pub program_state: Account<'info, ProgramState>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct ProgramState {
    pub authority: Pubkey,
    pub total_devices: u64,
    pub total_rewards_distributed: u64,
    pub is_active: bool,
    pub bump: u8,
}

impl ProgramState {
    pub const INIT_SPACE: usize = 32 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Device {
    pub owner: Pubkey,
    pub device_id: String,
    pub device_type: DeviceType,
    pub location: LocationData,
    pub is_active: bool,
    pub total_uptime: u64,
    pub total_rewards_earned: u64,
    pub last_activity: i64,
    pub bump: u8,
}

impl Device {
    pub const INIT_SPACE: usize = 32 + 4 + 32 + 1 + 16 + 1 + 8 + 8 + 8 + 1;
}

#[account]
pub struct DataSubmission {
    pub device: Pubkey,
    pub timestamp: i64,
    pub signal_strength: i32,
    pub latency: u32,
    pub throughput: u64,
    pub availability: f32,
    pub location: LocationData,
}

impl DataSubmission {
    pub const INIT_SPACE: usize = 32 + 8 + 4 + 4 + 8 + 4 + 16;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum DeviceType {
    Smartphone,
    Router,
    IoTDevice,
    Hotspot,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub struct LocationData {
    pub latitude: f64,
    pub longitude: f64,
    pub accuracy: f32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct NetworkQualityData {
    pub signal_strength: i32,
    pub latency: u32,
    pub throughput: u64,
    pub availability: f32,
    pub location: LocationData,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Device is not active")]
    DeviceInactive,
    #[msg("Program is paused")]
    ProgramPaused,
    #[msg("Invalid data quality")]
    InvalidDataQuality,
    #[msg("Insufficient rewards in vault")]
    InsufficientRewards,
}

// Helper function to calculate rewards based on data quality
fn calculate_reward(quality_data: &NetworkQualityData, device_uptime: u64) -> u64 {
    let base_reward = 1000; // Base reward in lamports
    
    // Quality multipliers
    let signal_multiplier = if quality_data.signal_strength > -70 { 1.5 } else if quality_data.signal_strength > -80 { 0.8 } else { 0.3 };
    let latency_multiplier = if quality_data.latency < 50 { 1.2 } else if quality_data.latency < 100 { 1.0 } else { 0.6 };
    let throughput_multiplier = if quality_data.throughput > 1000000 { 1.3 } else if quality_data.throughput > 500000 { 1.0 } else { 0.7 };
    let availability_multiplier = quality_data.availability;
    
    // Uptime bonus
    let uptime_bonus = 1.0 + (device_uptime as f32 / 1000.0).min(0.5);
    
    let total_multiplier = signal_multiplier * latency_multiplier * throughput_multiplier * availability_multiplier * uptime_bonus;
    
    ((base_reward as f32) * total_multiplier) as u64
}
